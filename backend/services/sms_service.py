import os
import uuid
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from ..models import SmsLogModel, SettingsModel
from ..websocket_manager import manager

async def dispatch_sms(
    to_phone: str,
    message: str,
    trigger: str = "Manual",
    db: Optional[Session] = None,
    account_sid: Optional[str] = None,
    auth_token: Optional[str] = None,
    from_phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an SMS via Twilio API if credentials are provided,
    otherwise performs a reliable simulated dispatch with full delivery tracking.
    """
    # 1. Resolve Twilio credentials
    sid = account_sid or os.environ.get("TWILIO_ACCOUNT_SID")
    token = auth_token or os.environ.get("TWILIO_AUTH_TOKEN")
    sender = from_phone or os.environ.get("TWILIO_PHONE_NUMBER")

    # If not in env, check database settings
    if db and (not sid or not token or not sender):
        settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
        if settings and settings.businessSettings:
            twilio_cfg = settings.businessSettings.get("twilioSettings", {})
            sid = sid or twilio_cfg.get("accountSid")
            token = token or twilio_cfg.get("authToken")
            sender = sender or twilio_cfg.get("fromPhone")

    status = "simulated"
    message_sid = f"SM_sim_{uuid.uuid4().hex[:12]}"
    error_detail = None

    # 2. If real Twilio credentials are provided, make the REST request
    if sid and token and sender and not sid.startswith("AC_mock") and len(sid) >= 10:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    data={
                        "From": sender,
                        "To": to_phone,
                        "Body": message
                    },
                    auth=(sid, token)
                )
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    status = "sent"
                    message_sid = data.get("sid", message_sid)
                else:
                    error_detail = f"Twilio API error ({resp.status_code}): {resp.text}"
                    status = "failed"
                    print(error_detail)
        except Exception as e:
            error_detail = f"Twilio connection error: {str(e)}"
            status = "failed"
            print(error_detail)

    # 3. Log SMS into database
    log_id = f"sms-log-{uuid.uuid4().hex[:8]}"
    if db:
        sms_log = SmsLogModel(
            id=log_id,
            toPhone=to_phone,
            message=message,
            trigger=trigger,
            status=status,
            sid=message_sid,
            sentAt=datetime.utcnow()
        )
        db.add(sms_log)
        db.commit()
        db.refresh(sms_log)

        # Broadcast WebSocket event so frontend Outbox table updates in real time
        await manager.broadcast({
            "type": "NEW_SMS_LOG",
            "data": {
                "id": sms_log.id,
                "toPhone": sms_log.toPhone,
                "message": sms_log.message,
                "trigger": sms_log.trigger,
                "status": sms_log.status,
                "sid": sms_log.sid,
                "sentAt": sms_log.sentAt.strftime("%Y-%m-%d %H:%M:%S")
            }
        })

    return {
        "status": status,
        "sid": message_sid,
        "to": to_phone,
        "trigger": trigger,
        "message": message,
        "error": error_detail,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

async def send_emergency_alert_to_owner(call: Any, db: Session) -> Optional[Dict[str, Any]]:
    """Automatically sends high-priority SMS alert to business owner when emergency call arrives."""
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    owner_phone = "+1 (512) 800-1234"
    if settings and settings.businessSettings:
        owner_phone = settings.businessSettings.get("ownerPhone", owner_phone)

    msg = (
        f"🚨 EMERGENCY ALERT: {call.serviceType} emergency from {call.callerName} "
        f"({call.callerPhone}) at {call.address}. Urgency: HIGH. "
        f"Summary: {call.summary}. View call in HomeServe AI dashboard."
    )

    return await dispatch_sms(
        to_phone=owner_phone,
        message=msg,
        trigger="Emergency Alert",
        db=db
    )

async def send_booking_confirmation(booking: Any, db: Session) -> Optional[Dict[str, Any]]:
    """Automatically sends SMS confirmation to customer when booking is created."""
    tech_str = f"Tech: {booking.technicianAssigned}. " if booking.technicianAssigned else ""
    msg = (
        f"Hi {booking.customerName}! Your {booking.serviceType} appointment with HomeServe AI "
        f"is confirmed for {booking.date} at {booking.time}. {tech_str}Address: {booking.address}. "
        f"Questions? Reply to this text. — HomeServe Team"
    )

    return await dispatch_sms(
        to_phone=booking.phone,
        message=msg,
        trigger="Booking Confirmation",
        db=db
    )

