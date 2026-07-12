"""
Analytics API endpoints.
GET /analytics/summary        — role-aware summary stats
GET /analytics/donations/trend — donation volume over time
GET /analytics/categories     — item category breakdown
GET /analytics/matching-rate  — match success rate
GET /analytics/pickups        — pickup completion stats
"""
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    AdminSummary, DonorSummary, NGOSummary,
    CategoryBreakdown, MatchingRatePoint, PickupStats, TrendPoint,
)
from app.schemas.common import APIResponse
from app.services import analytics_service
from app.models.enums import UserRole

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=APIResponse[dict])
def get_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    data = analytics_service.get_summary(db, current_user)
    return APIResponse.ok(data, "Summary retrieved")


@router.get("/donations/trend", response_model=APIResponse[list[TrendPoint]])
def donation_trend(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    days: int = Query(default=30, ge=7, le=365),
):
    data = analytics_service.get_donation_trend(db, current_user, days)
    return APIResponse.ok([TrendPoint(**d) for d in data])


@router.get("/categories", response_model=APIResponse[list[CategoryBreakdown]])
def category_breakdown(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    data = analytics_service.get_category_breakdown(db, current_user)
    return APIResponse.ok([CategoryBreakdown(**d) for d in data])


@router.get("/matching-rate", response_model=APIResponse[list[MatchingRatePoint]])
def matching_rate(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    days: int = Query(default=30, ge=7, le=365),
):
    data = analytics_service.get_matching_rate(db, days)
    return APIResponse.ok([MatchingRatePoint(**d) for d in data])


@router.get("/pickups", response_model=APIResponse[PickupStats])
def pickup_stats(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    data = analytics_service.get_pickup_stats(db, current_user)
    return APIResponse.ok(PickupStats(**data))
