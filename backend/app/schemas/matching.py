"""Match schemas."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.enums import MatchStatus


class MatchResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    donation_id: UUID
    ngo_demand_id: Optional[UUID] = None
    ngo_id: UUID
    score: float
    status: MatchStatus
    proposed_at: datetime
    responded_at: Optional[datetime] = None
    expires_at: datetime
    rejection_reason: Optional[str] = None
    donation_notes: Optional[str] = None
    items_summary: Optional[str] = None
    demand_item_name: Optional[str] = None
    score_breakdown: Optional[dict[str, Any]] = None
    match_explanation: Optional[list[str]] = None


class MatchActionRequest(BaseModel):
    """Used by NGO to accept or reject a match."""
    rejection_reason: Optional[str] = None
