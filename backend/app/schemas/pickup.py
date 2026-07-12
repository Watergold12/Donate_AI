"""Pickup request schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.enums import PickupStatus


class PickupCreate(BaseModel):
    donation_id: UUID
    ngo_id: UUID
    match_id: UUID
    scheduled_at: datetime
    pickup_address: str
    pickup_city: str
    contact_phone: Optional[str] = None
    notes: Optional[str] = None


class PickupUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    pickup_address: Optional[str] = None
    pickup_city: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None


class PickupStatusUpdate(BaseModel):
    status: PickupStatus


class PickupResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    donation_id: UUID
    ngo_id: UUID
    match_id: UUID
    status: PickupStatus
    scheduled_at: datetime
    pickup_address: str
    pickup_city: str
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
