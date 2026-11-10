from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime
from datetime import datetime
from .database import Base

class CallModel(Base):
    __tablename__ = "calls"

    id = Column(String, primary_key=True, index=True)
    callerName = Column(String, index=True)
    callerPhone = Column(String)
    serviceType = Column(String)
    time = Column(String)
    duration = Column(String)
    status = Column(String) # 'completed' | 'emergency' | 'missed' | 'transferred' | 'scheduled'
    leadScore = Column(Integer, nullable=True)
    summary = Column(Text)
    address = Column(String)
    urgency = Column(String) # 'standard' | 'emergency'
    transcriptSnippet = Column(JSON, default=list)
    smseSent = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

class LeadModel(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    email = Column(String)
    serviceType = Column(String)
    address = Column(String)
    tier = Column(String) # 'hot' | 'warm' | 'cold' | 'new'
    score = Column(Integer)
    lastContact = Column(String)
    estimatedValue = Column(Float)
    notes = Column(Text)
    status = Column(String) # 'new' | 'qualified' | 'scheduled' | 'closed' | 'lost'
    callId = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class BookingModel(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, index=True)
    customerName = Column(String, index=True)
    serviceType = Column(String)
    date = Column(String)
    time = Column(String)
    address = Column(String)
    phone = Column(String)
    estimatedDuration = Column(String)
    status = Column(String) # 'confirmed' | 'pending' | 'completed' | 'cancelled'
    technicianAssigned = Column(String, nullable=True)
    estimatedValue = Column(Float)
    createdAt = Column(DateTime, default=datetime.utcnow)

class SmsTemplateModel(Base):
    __tablename__ = "sms_templates"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    trigger = Column(String)
    content = Column(Text)
    active = Column(Boolean, default=True)
    sentCount = Column(Integer, default=0)

class SettingsModel(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    voiceSettings = Column(JSON, default=dict)
    businessSettings = Column(JSON, default=dict)
    qualificationSettings = Column(JSON, default=dict)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    fullName = Column(String)
    hashedPassword = Column(String)
    role = Column(String, default="owner")
    createdAt = Column(DateTime, default=datetime.utcnow)

class SmsLogModel(Base):
    __tablename__ = "sms_logs"

    id = Column(String, primary_key=True, index=True)
    toPhone = Column(String)
    message = Column(Text)
    trigger = Column(String) # 'Emergency Alert' | 'Booking Confirmation' | 'Test' | 'Manual'
    status = Column(String) # 'delivered' | 'sent' | 'simulated' | 'failed'
    sid = Column(String, nullable=True)
    sentAt = Column(DateTime, default=datetime.utcnow)

