"""Analytics and dashboard schemas."""
from typing import List
from pydantic import BaseModel
from app.models.enums import ItemCategory


class DonorSummary(BaseModel):
    total_donations: int
    completed_donations: int
    pending_donations: int
    total_items_donated: int


class NGOSummary(BaseModel):
    total_demands: int
    active_demands: int
    total_matches: int
    accepted_matches: int
    pickups_completed: int


class AdminSummary(BaseModel):
    total_users: int
    total_donors: int
    total_ngos: int
    pending_ngo_verifications: int
    total_donations: int
    total_matches: int
    match_success_rate: float


class TrendPoint(BaseModel):
    date: str
    count: int


class CategoryBreakdown(BaseModel):
    category: ItemCategory
    count: int
    percentage: float


class MatchingRatePoint(BaseModel):
    date: str
    total_matches: int
    accepted: int
    rate: float


class PickupStats(BaseModel):
    total_scheduled: int
    completed: int
    failed: int
    completion_rate: float
