"""Donor profile schemas."""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class DonorProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class DonorProfileResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    user_id: UUID
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
