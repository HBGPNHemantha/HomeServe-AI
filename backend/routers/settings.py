from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SettingsModel
from ..schemas import SettingsResponse, SettingsBase

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    if not settings:
        # Defaults
        settings = SettingsModel(
            id=1,
            voiceSettings={
                "agentName": "Sarah",
                "voiceModel": "nova",
                "greeting": "Hi, you've reached HomeServe. I'm Sarah, your AI assistant. How can I help you today?",
                "language": "en-US",
                "maxCallDuration": "15",
                "enableTranscription": True,
                "enableRecording": True,
                "lowLatencyMode": True,
            },
            businessSettings={
                "businessName": "Austin HomeServe",
                "ownerPhone": "+1 (512) 800-1234",
                "businessPhone": "+1 (512) 555-0100",
                "timezone": "America/Chicago",
                "hoursStart": "08:00",
                "hoursEnd": "18:00",
                "emergencyAfterHours": True,
                "calendarIntegration": "google",
            },
            qualificationSettings={
                "minimumLeadScore": "60",
                "emergencyKeywords": "burst pipe, gas odor, flooding, smoke, fire, electrical fire, no heat, no AC",
                "autoSchedule": True,
                "requireAddress": True,
                "requirePhone": True,
                "routeEmergencies": True,
            }
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=SettingsResponse)
def update_settings(payload: SettingsBase, db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).filter(SettingsModel.id == 1).first()
    if not settings:
        settings = SettingsModel(id=1)
        db.add(settings)

    settings.voiceSettings = payload.voiceSettings
    settings.businessSettings = payload.businessSettings
    settings.qualificationSettings = payload.qualificationSettings
    db.commit()
    db.refresh(settings)
    return settings

