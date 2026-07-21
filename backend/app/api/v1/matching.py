"""
Matching API endpoints.
GET  /matching/results   — list matches (role-aware: NGO, donor, admin)
POST /matching/trigger   — admin: trigger a full matching pass
"""
import math
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_admin
from app.database import get_db
from app.models.donation import Donation
from app.models.donor import DonorProfile
from app.models.enums import MatchStatus, UserRole
from app.models.match import Match
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.matching import MatchResponse
from app.services import ngo_service, matching_service
from app.utils.pagination import PaginationMeta, PaginationParams, paginate

router = APIRouter(prefix="/matching", tags=["Matching"])


def _pagination_meta(page: int, size: int, total: int) -> PaginationMeta:
    return PaginationMeta(
        page=page, size=size, total=total,
        pages=max(1, math.ceil(total / size)) if total > 0 else 1,
    )


@router.get("/results", response_model=PaginatedAPIResponse[MatchResponse])
def list_match_results(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
    status_filter: Optional[MatchStatus] = None,
):
    if current_user.role == UserRole.ngo:
        items, total = ngo_service.list_matches(db, current_user, params, status_filter)
    elif current_user.role == UserRole.donor:
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == current_user.id).first()
        query = db.query(Match)
        if donor:
            sub = (
                db.query(Donation.id)
                .filter(Donation.donor_id == donor.id, Donation.deleted_at.is_(None))
                .subquery()
            )
            query = query.filter(Match.donation_id.in_(sub))
        else:
            query = query.filter(Match.id.is_(None))
        if status_filter:
            query = query.filter(Match.status == status_filter)
        query = query.order_by(Match.proposed_at.desc())
        items, total = paginate(query, params)
    else:
        # admin: all matches
        query = db.query(Match)
        if status_filter:
            query = query.filter(Match.status == status_filter)
        query = query.order_by(Match.proposed_at.desc())
        items, total = paginate(query, params)

    return PaginatedAPIResponse(
        data=[MatchResponse.model_validate(m) for m in items],
        message="Matches retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.post("/trigger", response_model=APIResponse[None])
def trigger_matching(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    count = matching_service.trigger_full_match(db)
    return APIResponse.ok(None, f"{count} new match(es) created")
