from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..database import get_db
from ..models import CallModel
from ..schemas import CallResponse, CallCreate

router = APIRouter(prefix="/api/calls", tags=["calls"])

@router.get("", response_model=List[CallResponse])
def get_calls(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CallModel)
    if status and status != "all":
        query = query.filter(CallModel.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (CallModel.callerName.ilike(s)) |
            (CallModel.callerPhone.ilike(s)) |
            (CallModel.serviceType.ilike(s))
        )
    return query.order_by(CallModel.id.desc()).all()

@router.get("/{call_id}", response_model=CallResponse)
def get_call(call_id: str, db: Session = Depends(get_db)):
    call = db.query(CallModel).filter(CallModel.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

@router.post("", response_model=CallResponse, status_code=201)
def create_call(call_data: CallCreate, db: Session = Depends(get_db)):
    call_id = call_data.id or f"call-{uuid.uuid4().hex[:6]}"
    db_call = CallModel(
        id=call_id,
        callerName=call_data.callerName,
        callerPhone=call_data.callerPhone,
        serviceType=call_data.serviceType,
        time=call_data.time,
        duration=call_data.duration,
        status=call_data.status,
        leadScore=call_data.leadScore,
        summary=call_data.summary,
        address=call_data.address,
        urgency=call_data.urgency,
        transcriptSnippet=[t.model_dump() for t in call_data.transcriptSnippet],
        smseSent=call_data.smseSent,
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call

@router.delete("/{call_id}")
def delete_call(call_id: str, db: Session = Depends(get_db)):
    call = db.query(CallModel).filter(CallModel.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    db.delete(call)
    db.commit()
    return {"message": "Call deleted successfully"}

