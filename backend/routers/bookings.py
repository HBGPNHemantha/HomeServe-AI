from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from ..database import get_db
from ..models import BookingModel
from ..schemas import BookingResponse, BookingCreate, BookingUpdate
from ..websocket_manager import manager

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

@router.get("", response_model=List[BookingResponse])
def get_bookings(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(BookingModel)
    if status and status != "all":
        query = query.filter(BookingModel.status == status)
    return query.order_by(BookingModel.date.asc(), BookingModel.time.asc()).all()

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(BookingModel).filter(BookingModel.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(booking_data: BookingCreate, db: Session = Depends(get_db)):
    booking_id = booking_data.id or f"book-{uuid.uuid4().hex[:6]}"
    db_booking = BookingModel(
        id=booking_id,
        customerName=booking_data.customerName,
        serviceType=booking_data.serviceType,
        date=booking_data.date,
        time=booking_data.time,
        address=booking_data.address,
        phone=booking_data.phone,
        estimatedDuration=booking_data.estimatedDuration,
        status=booking_data.status,
        technicianAssigned=booking_data.technicianAssigned,
        estimatedValue=booking_data.estimatedValue,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    await manager.broadcast({
        "type": "NEW_BOOKING",
        "data": {
            "id": db_booking.id,
            "customerName": db_booking.customerName,
            "serviceType": db_booking.serviceType,
            "date": db_booking.date,
            "time": db_booking.time,
            "address": db_booking.address,
            "phone": db_booking.phone,
            "estimatedDuration": db_booking.estimatedDuration,
            "status": db_booking.status,
            "technicianAssigned": db_booking.technicianAssigned,
            "estimatedValue": db_booking.estimatedValue,
        }
    })

    return db_booking

@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, booking_data: BookingUpdate, db: Session = Depends(get_db)):
    booking = db.query(BookingModel).filter(BookingModel.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_data = booking_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)
    
    db.commit()
    db.refresh(booking)

    await manager.broadcast({
        "type": "UPDATE_BOOKING",
        "data": {
            "id": booking.id,
            "status": booking.status,
            "date": booking.date,
            "time": booking.time,
            "customerName": booking.customerName,
        }
    })

    return booking
    return booking

@router.delete("/{booking_id}")
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(BookingModel).filter(BookingModel.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted successfully"}

