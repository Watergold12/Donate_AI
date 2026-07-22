"""NGO profile and verification schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class NGOProfileUpdate(BaseModel):
    org_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    service_areas: Optional[List[str]] = None


class NGOProfileResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    user_id: UUID
    org_name: str
    registration_number: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    service_areas: Optional[List[str]] = None
    verification_status: str = "unsubmitted"
    verification_doc_path: Optional[str] = None
    rejection_reason: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class NGOVerifyRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None
