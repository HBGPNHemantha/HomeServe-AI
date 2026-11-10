from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel
import uuid
from datetime import datetime

from ..database import get_db
from ..models import CallModel, LeadModel, SettingsModel
from ..services.ai_analyzer import analyze_call_transcript
from ..services.sms_service import send_emergency_alert_to_owner
from ..websocket_manager import manager

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

class TranscriptSnippetItem(BaseModel):
    speaker: str
    text: str

class VoiceCallPayload(BaseModel):
    call_id: Optional[str] = None
    caller_phone: str = "+1 (512) 555-0199"
    caller_name: Optional[str] = "Unknown"
    duration: Optional[str] = "2:30"
    transcript: Union[str, List[TranscriptSnippetItem]]
    status: Optional[str] = "completed"

def format_transcript_list(transcript: Union[str, List[TranscriptSnippetItem]]) -> List[Dict[str, str]]:
    if isinstance(transcript, list):
        return [t.model_dump() if hasattr(t, "model_dump") else dict(t) for t in transcript]
    
    # If transcript is a single string with "AI:" or "Caller:" or lines:
    items = []
    lines = transcript.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.lower().startswith("ai:") or line.lower().startswith("sarah:"):
            items.append({"speaker": "AI", "text": line.split(":", 1)[1].strip()})
        elif line.lower().startswith("caller:") or line.lower().startswith("user:"):
            items.append({"speaker": "Caller", "text": line.split(":", 1)[1].strip()})
        else:
            items.append({"speaker": "Caller", "text": line})
    return items

def extract_plain_text_transcript(transcript: Union[str, List[TranscriptSnippetItem]]) -> str:
    if isinstance(transcript, str):
        return transcript
    return "\n".join([f"{t.speaker}: {t.text}" if hasattr(t, "speaker") else f"{t['speaker']}: {t['text']}" for t in transcript])

@router.post("/voice")
async def handle_voice_webhook(payload: VoiceCallPayload, db: Session = Depends(get_db)):
    """
    Standard voice webhook endpoint. Receives call details and transcript,
    analyzes them with AI, and creates call records & qualified leads.
    """
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    emergency_kw = ""
    min_score = 60
    if settings and settings.qualificationSettings:
        emergency_kw = settings.qualificationSettings.get("emergencyKeywords", "")
        min_score = int(settings.qualificationSettings.get("minimumLeadScore", 60))

    plain_transcript = extract_plain_text_transcript(payload.transcript)
    snippet_list = format_transcript_list(payload.transcript)

    # 1. AI Analysis
    analysis = await analyze_call_transcript(
        transcript=plain_transcript,
        caller_phone=payload.caller_phone,
        caller_name=payload.caller_name or "Unknown",
        emergency_keywords=emergency_kw
    )

    call_id = payload.call_id or f"call-{uuid.uuid4().hex[:6]}"
    call_status = "emergency" if analysis["urgency"] == "emergency" else payload.status or "completed"

    now = datetime.now()
    call_time = now.strftime("%H:%M")

    # 2. Save Call Record
    db_call = CallModel(
        id=call_id,
        callerName=analysis["customer_name"],
        callerPhone=payload.caller_phone,
        serviceType=analysis["service_type"],
        time=call_time,
        duration=payload.duration or "3:10",
        status=call_status,
        leadScore=analysis["lead_score"],
        summary=analysis["summary"],
        address=analysis["address"],
        urgency=analysis["urgency"],
        transcriptSnippet=snippet_list,
        smseSent=True
    )
    db.add(db_call)

    # 3. Auto-qualify and create Lead if score meets threshold
    db_lead = None
    if analysis["lead_score"] >= min_score:
        lead_id = f"lead-{uuid.uuid4().hex[:6]}"
        db_lead = LeadModel(
            id=lead_id,
            name=analysis["customer_name"],
            phone=payload.caller_phone,
            email=f"{analysis['customer_name'].lower().replace(' ', '.')}@email.com",
            serviceType=analysis["service_type"],
            address=analysis["address"],
            tier=analysis["tier"],
            score=analysis["lead_score"],
            lastContact="Just now",
            estimatedValue=analysis["estimated_value"],
            notes=f"AI Summary: {analysis['summary']}\nUrgency: {analysis['urgency'].upper()}",
            status="qualified" if analysis["urgency"] != "emergency" else "new",
            callId=call_id
        )
        db.add(db_lead)

    db.commit()
    db.refresh(db_call)
    if db_lead:
        db.refresh(db_lead)

    # If this is an emergency, automatically dispatch high-priority SMS alert to business owner
    if analysis["urgency"] == "emergency":
        try:
            await send_emergency_alert_to_owner(db_call, db)
        except Exception as e:
            print(f"Failed to send emergency SMS alert: {e}")

    # Broadcast real-time event to all connected dashboard clients
    await manager.broadcast({
        "type": "NEW_CALL",
        "data": {
            "call": {
                "id": db_call.id,
                "callerName": db_call.callerName,
                "callerPhone": db_call.callerPhone,
                "serviceType": db_call.serviceType,
                "time": db_call.time,
                "duration": db_call.duration,
                "status": db_call.status,
                "leadScore": db_call.leadScore,
                "summary": db_call.summary,
                "address": db_call.address,
                "urgency": db_call.urgency,
                "transcriptSnippet": db_call.transcriptSnippet,
                "smseSent": db_call.smseSent,
            },
            "lead": {
                "id": db_lead.id,
                "name": db_lead.name,
                "phone": db_lead.phone,
                "serviceType": db_lead.serviceType,
                "tier": db_lead.tier,
                "score": db_lead.score,
                "estimatedValue": db_lead.estimatedValue,
            } if db_lead else None,
            "isEmergency": analysis["urgency"] == "emergency"
        }
    })

    return {
        "status": "success",
        "call_id": db_call.id,
        "lead_created": db_lead.id if db_lead else None,
        "analysis": analysis
    }

@router.post("/vapi")
async def handle_vapi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Native Vapi.ai webhook endpoint. Ingests end-of-call reports from Vapi voice assistants.
    """
    body = await request.json()
    message = body.get("message", {})

    # We process when message is 'end-of-call-report' or full call payload
    call_obj = message.get("call", body.get("call", {}))
    customer = call_obj.get("customer", {})
    phone = customer.get("number", "+1 (512) 555-0100")
    name = customer.get("name", "Vapi Caller")
    
    transcript = message.get("transcript") or body.get("transcript", "")
    duration_secs = call_obj.get("duration", 120)
    minutes = duration_secs // 60
    seconds = duration_secs % 60
    duration_str = f"{minutes}:{seconds:02d}"

    payload = VoiceCallPayload(
        call_id=call_obj.get("id"),
        caller_phone=phone,
        caller_name=name,
        duration=duration_str,
        transcript=transcript,
        status="completed"
    )

    return await handle_voice_webhook(payload, db)

@router.post("/simulate")
async def simulate_incoming_call(scenario: str = "burst_pipe", db: Session = Depends(get_db)):
    """
    Test helper endpoint: generates a realistic simulated AI phone call transcript
    and processes it through the entire AI webhook pipeline!
    """
    scenarios = {
        "burst_pipe": {
            "name": "Jennifer Vance",
            "phone": "+1 (512) 710-4491",
            "duration": "4:12",
            "transcript": [
                {"speaker": "AI", "text": "Thank you for calling Austin HomeServe. I'm Sarah, your AI assistant. How can I help you today?"},
                {"speaker": "Caller", "text": "Hello Sarah, I have an emergency! A pipe burst under my bathroom floor and there's water flooding into the hallway right now!"},
                {"speaker": "AI", "text": "Oh no, I'm so sorry! First, do you know where your main water shutoff valve is located to stop the water?"},
                {"speaker": "Caller", "text": "Yes, my husband is outside shutting it off right now, but we need someone here as soon as possible."},
                {"speaker": "AI", "text": "Great thinking. Can you confirm your address so I can dispatch our on-call emergency plumber?"},
                {"speaker": "Caller", "text": "We are at 3409 Shadow Ridge Pass, Austin TX 78749."},
                {"speaker": "AI", "text": "Got it, 3409 Shadow Ridge Pass. I am alerting our master plumber and transferring the urgent ticket right now."},
            ]
        },
        "ac_repair": {
            "name": "Marcus Sterling",
            "phone": "+1 (737) 802-3311",
            "duration": "2:55",
            "transcript": [
                {"speaker": "AI", "text": "HomeServe, this is Sarah. How can I assist you with your home today?"},
                {"speaker": "Caller", "text": "Hey Sarah, our AC compressor is making a loud buzzing sound and blowing warm air. In this 98 degree heat we really need a technician."},
                {"speaker": "AI", "text": "That sounds miserable in this weather! What is your address so I can check availability for an HVAC specialist?"},
                {"speaker": "Caller", "text": "I'm at 1410 East 6th Street in Austin. Can someone come tomorrow morning?"},
                {"speaker": "AI", "text": "We have an open diagnostic slot tomorrow at 10:00 AM. Does that work for you Marcus?"},
                {"speaker": "Caller", "text": "Yes, 10 AM is perfect. Please put me down."},
            ]
        },
        "roofing": {
            "name": "Amanda Rodriguez",
            "phone": "+1 (512) 993-2104",
            "duration": "3:20",
            "transcript": [
                {"speaker": "AI", "text": "Thank you for calling HomeServe. I'm Sarah. What project can we help you with?"},
                {"speaker": "Caller", "text": "Hi Sarah, after that hail storm on Tuesday we noticed several shingles flew off our roof and we might need an insurance estimate."},
                {"speaker": "AI", "text": "I can certainly get an inspector out to give you a full storm damage estimate. What's the property address?"},
                {"speaker": "Caller", "text": "7203 Great Hills Trail, Austin TX."},
                {"speaker": "AI", "text": "Thank you Amanda. I've noted storm damage and booked a free roof assessment for Friday."},
            ]
        }
    }

    selected = scenarios.get(scenario, scenarios["burst_pipe"])
    payload = VoiceCallPayload(
        caller_name=selected["name"],
        caller_phone=selected["phone"],
        duration=selected["duration"],
        transcript=[TranscriptSnippetItem(**t) for t in selected["transcript"]],
        status="completed"
    )
    return await handle_voice_webhook(payload, db)

