from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
from ..database import get_db
from ..models import SmsTemplateModel
from ..schemas import SmsTemplateResponse, SmsTemplateUpdate, SmsTemplateBase

router = APIRouter(prefix="/api/sms", tags=["sms"])

class SendSmsRequest(BaseModel):
    to: str
    message: str
    templateId: str | None = None

class SmsTemplateCreate(SmsTemplateBase):
    id: Optional[str] = None

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
def send_sms(request: SendSmsRequest, db: Session = Depends(get_db)):
    # Update template count if template was used
    if request.templateId:
        template = db.query(SmsTemplateModel).filter(SmsTemplateModel.id == request.templateId).first()
        if template:
            template.sentCount = (template.sentCount or 0) + 1
            db.commit()
    
    # In real world this would connect to Twilio / AWS SNS
    return {
        "status": "sent",
        "to": request.to,
        "message": request.message,
        "timestamp": "Just now"
    }

