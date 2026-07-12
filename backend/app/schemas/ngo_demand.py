"""NGO demand schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from app.models.enums import DemandUrgency, ItemCategory


class NGODemandCreate(BaseModel):
    item_category: ItemCategory
    item_name: Optional[str] = None
    quantity_needed: int
    urgency_level: DemandUrgency = DemandUrgency.medium
    description: Optional[str] = None
    expires_at: Optional[datetime] = None

    @field_validator("quantity_needed")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class NGODemandUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity_needed: Optional[int] = None
    urgency_level: Optional[DemandUrgency] = None
    description: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class NGODemandResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    ngo_id: UUID
    item_category: ItemCategory
    item_name: Optional[str] = None
    quantity_needed: int
    quantity_fulfilled: int
    urgency_level: DemandUrgency
    description: Optional[str] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
