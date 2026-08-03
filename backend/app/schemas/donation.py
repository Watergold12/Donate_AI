"""Donation and DonationItem schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from app.models.enums import DonationStatus, ItemCategory, ItemCondition


class DonationItemCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    category: ItemCategory
    quantity: int = 1
    condition: ItemCondition = ItemCondition.good
    ai_detected: bool = False
    confidence_score: Optional[float] = None
    image_path: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class DonationItemUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ItemCategory] = None
    quantity: Optional[int] = None
    condition: Optional[ItemCondition] = None
    is_confirmed: Optional[bool] = None


class DonationItemResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    donation_id: UUID
    item_name: str
    description: Optional[str] = None
    category: ItemCategory
    quantity: int
    condition: ItemCondition
    ai_detected: bool
    confidence_score: Optional[float] = None
    image_path: Optional[str] = None
    is_confirmed: bool


class DonationCreate(BaseModel):
    notes: Optional[str] = None


class DonationUpdate(BaseModel):
    notes: Optional[str] = None


class DonationResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    donor_id: UUID
    status: DonationStatus
    notes: Optional[str] = None
    total_items: int
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[DonationItemResponse] = []


class PackagingChecklistResponse(BaseModel):
    donation_id: UUID
    status: DonationStatus
    acknowledged: bool
    summary: str
    general_steps: List[str]
    item_guidance: List[str]
