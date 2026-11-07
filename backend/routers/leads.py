from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..database import get_db
from ..models import LeadModel
from ..schemas import LeadResponse, LeadCreate, LeadUpdate
from ..websocket_manager import manager

router = APIRouter(prefix="/api/leads", tags=["leads"])

@router.get("", response_model=List[LeadResponse])
def get_leads(
    tier: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(LeadModel)
    if tier and tier != "all":
        query = query.filter(LeadModel.tier == tier)
    if status and status != "all":
        query = query.filter(LeadModel.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (LeadModel.name.ilike(s)) |
            (LeadModel.email.ilike(s)) |
            (LeadModel.phone.ilike(s)) |
            (LeadModel.serviceType.ilike(s))
        )
    return query.order_by(LeadModel.score.desc()).all()

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    lead_id = lead_data.id or f"lead-{uuid.uuid4().hex[:6]}"
    db_lead = LeadModel(
        id=lead_id,
        name=lead_data.name,
        phone=lead_data.phone,
        email=lead_data.email,
        serviceType=lead_data.serviceType,
        address=lead_data.address,
        tier=lead_data.tier,
        score=lead_data.score,
        lastContact=lead_data.lastContact,
        estimatedValue=lead_data.estimatedValue,
        notes=lead_data.notes,
        status=lead_data.status,
        callId=lead_data.callId,
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    await manager.broadcast({
        "type": "NEW_LEAD",
        "data": {
            "id": db_lead.id,
            "name": db_lead.name,
            "phone": db_lead.phone,
            "serviceType": db_lead.serviceType,
            "tier": db_lead.tier,
            "score": db_lead.score,
            "estimatedValue": db_lead.estimatedValue,
            "status": db_lead.status,
        }
    })

    return db_lead

@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, lead_data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = lead_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    db.commit()
    db.refresh(lead)

    await manager.broadcast({
        "type": "UPDATE_LEAD",
        "data": {
            "id": lead.id,
            "name": lead.name,
            "score": lead.score,
            "tier": lead.tier,
            "status": lead.status,
        }
    })

    return lead
    return lead

@router.delete("/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

