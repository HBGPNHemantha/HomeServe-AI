from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class TranscriptItem(BaseModel):
    speaker: str # 'AI' | 'Caller'
    text: str

# Call Schemas
class CallBase(BaseModel):
    callerName: str
    callerPhone: str
    serviceType: str
    time: str
    duration: str
    status: str # 'completed' | 'emergency' | 'missed' | 'transferred' | 'scheduled'
    leadScore: Optional[int] = None
    summary: str
    address: str
    urgency: str # 'standard' | 'emergency'
    transcriptSnippet: List[TranscriptItem] = []
    smseSent: bool = False

class CallCreate(CallBase):
    id: Optional[str] = None

class CallResponse(CallBase):
    id: str
    createdAt: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# Lead Schemas
class LeadBase(BaseModel):
    name: str
    phone: str
    email: str
    serviceType: str
    address: str
    tier: str # 'hot' | 'warm' | 'cold' | 'new'
    score: int
    lastContact: str
    estimatedValue: float
    notes: str
    status: str # 'new' | 'qualified' | 'scheduled' | 'closed' | 'lost'
    callId: Optional[str] = None

class LeadCreate(LeadBase):
    id: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    serviceType: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[str] = None
    score: Optional[int] = None
    lastContact: Optional[str] = None
    estimatedValue: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    callId: Optional[str] = None

class LeadResponse(LeadBase):
    id: str
    createdAt: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# Booking Schemas
class BookingBase(BaseModel):
    customerName: str
    serviceType: str
    date: str
    time: str
    address: str
    phone: str
    estimatedDuration: str
    status: str # 'confirmed' | 'pending' | 'completed' | 'cancelled'
    technicianAssigned: Optional[str] = None
    estimatedValue: float

class BookingCreate(BookingBase):
    id: Optional[str] = None

class BookingUpdate(BaseModel):
    customerName: Optional[str] = None
    serviceType: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    estimatedDuration: Optional[str] = None
    status: Optional[str] = None
    technicianAssigned: Optional[str] = None
    estimatedValue: Optional[float] = None

class BookingResponse(BookingBase):
    id: str
    createdAt: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# SMS Template Schemas
class SmsTemplateBase(BaseModel):
    name: str
    trigger: str
    content: str
    active: bool = True
    sentCount: int = 0

class SmsTemplateUpdate(BaseModel):
    name: Optional[str] = None
    trigger: Optional[str] = None
    content: Optional[str] = None
    active: Optional[bool] = None
    sentCount: Optional[int] = None

class SmsTemplateResponse(SmsTemplateBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

# Settings Schemas
class SettingsBase(BaseModel):
    voiceSettings: Dict[str, Any]
    businessSettings: Dict[str, Any]
    qualificationSettings: Dict[str, Any]

class SettingsResponse(SettingsBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# User / Auth Schemas
class UserRegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str
    role: Optional[str] = "owner"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    createdAt: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse

