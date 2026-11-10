from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
from ..database import get_db
from ..models import SmsTemplateModel, SmsLogModel
from ..schemas import SmsTemplateResponse, SmsTemplateUpdate, SmsTemplateBase
from ..services.sms_service import dispatch_sms

router = APIRouter(prefix="/api/sms", tags=["sms"])

class SendSmsRequest(BaseModel):
    to: str
    message: str
    templateId: str | None = None
    trigger: str | None = "Manual Send"

class SmsTemplateCreate(SmsTemplateBase):
    id: Optional[str] = None

class TwilioTestRequest(BaseModel):
    accountSid: str
    authToken: str
    fromPhone: str
    toPhone: str
    testMessage: Optional[str] = "Hello from HomeServe AI! Your Twilio integration is active and verified."

@router.get("/templates", response_model=List[SmsTemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    return db.query(SmsTemplateModel).all()

@router.post("/templates", response_model=SmsTemplateResponse, status_code=201)
def create_template(template_data: SmsTemplateCreate, db: Session = Depends(get_db)):
    template_id = template_data.id or f"sms-{uuid.uuid4().hex[:6]}"
    template = SmsTemplateModel(
        id=template_id,
        name=template_data.name,
        trigger=template_data.trigger,
        content=template_data.content,
        active=template_data.active,
        sentCount=template_data.sentCount,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.delete("/templates/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    template = db.query(SmsTemplateModel).filter(SmsTemplateModel.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.patch("/templates/{template_id}", response_model=SmsTemplateResponse)
def update_template(template_id: str, template_data: SmsTemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(SmsTemplateModel).filter(SmsTemplateModel.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template

@router.post("/send")
async def send_sms(request: SendSmsRequest, db: Session = Depends(get_db)):
    # Update template count if template was used
    if request.templateId:
        template = db.query(SmsTemplateModel).filter(SmsTemplateModel.id == request.templateId).first()
        if template:
            template.sentCount = (template.sentCount or 0) + 1
            db.commit()
    
    result = await dispatch_sms(
        to_phone=request.to,
        message=request.message,
        trigger=request.trigger or "Manual Send",
        db=db
    )
    return result

@router.get("/logs")
def get_sms_logs(db: Session = Depends(get_db)):
    logs = db.query(SmsLogModel).order_by(SmsLogModel.sentAt.desc()).limit(50).all()
    return [
        {
            "id": l.id,
            "toPhone": l.toPhone,
            "message": l.message,
            "trigger": l.trigger,
            "status": l.status,
            "sid": l.sid,
            "sentAt": l.sentAt.strftime("%b %d, %H:%M")
        }
        for l in logs
    ]

@router.post("/test-twilio")
async def test_twilio(request: TwilioTestRequest, db: Session = Depends(get_db)):
    res = await dispatch_sms(
        to_phone=request.toPhone,
        message=request.testMessage or "Twilio integration test successful!",
        trigger="Twilio Test",
        db=db,
        account_sid=request.accountSid,
        auth_token=request.authToken,
        from_phone=request.fromPhone
    )
    return res
