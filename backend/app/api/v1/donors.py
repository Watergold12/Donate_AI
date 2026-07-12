"""
Donor API endpoints.
GET  /donors/profile        — get donor's own profile
PUT  /donors/profile        — update donor's profile
GET  /donors/donations      — list all donations (paginated, filterable by status)
GET  /donors/history        — donation history with full timeline
"""
import math
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_donor
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.donation import Donation
from app.models.donor import DonorProfile
from app.models.enums import AuditAction, DonationStatus
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.donor import DonorProfileResponse, DonorProfileUpdate
from app.schemas.donation import DonationResponse
from app.services import donation_service
from app.utils.audit import log_action
from app.utils.pagination import PaginationMeta, PaginationParams, paginate

router = APIRouter(prefix="/donors", tags=["Donors"])


def _get_donor_or_404(db: Session, user: User) -> DonorProfile:
    profile = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
    if not profile:
        raise NotFoundError("Donor profile")
    return profile


def _build_pagination(page: int, size: int, total: int) -> PaginationMeta:
    pages = max(1, math.ceil(total / size)) if total > 0 else 1
    return PaginationMeta(page=page, size=size, total=total, pages=pages)


@router.get("/profile", response_model=APIResponse[DonorProfileResponse])
def get_profile(
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return the authenticated donor's profile."""
    profile = _get_donor_or_404(db, current_user)
    return APIResponse.ok(DonorProfileResponse.model_validate(profile))


@router.put("/profile", response_model=APIResponse[DonorProfileResponse])
def update_profile(
    payload: DonorProfileUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    """Update the authenticated donor's profile fields."""
    profile = _get_donor_or_404(db, current_user)
    old_data = {"city": profile.city, "phone": profile.phone}

    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, val)

    log_action(
        db, AuditAction.UPDATE, "donor_profile", profile.id,
        actor_id=current_user.id, old_data=old_data, request=request,
    )
    db.commit()
    db.refresh(profile)
    return APIResponse.ok(DonorProfileResponse.model_validate(profile), "Profile updated")


@router.get("/donations", response_model=PaginatedAPIResponse[DonationResponse])
def list_my_donations(
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
    status_filter: Optional[DonationStatus] = None,
):
    """List all donations for the authenticated donor, optionally filtered by status."""
    items, total = donation_service.list_donations(db, current_user, params, status_filter)
    return PaginatedAPIResponse(
        data=[DonationResponse.model_validate(d) for d in items],
        message="Donations retrieved",
        pagination=_build_pagination(params.page, params.size, total),
    )


@router.get("/history", response_model=PaginatedAPIResponse[DonationResponse])
def donation_history(
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
):
    """Return completed and cancelled donations as the donor's history."""
    donor = _get_donor_or_404(db, current_user)
    query = (
        db.query(Donation)
        .filter(
            Donation.donor_id == donor.id,
            Donation.deleted_at.is_(None),
            Donation.status.in_([DonationStatus.completed, DonationStatus.cancelled]),
        )
        .order_by(Donation.created_at.desc())
    )
    items, total = paginate(query, params)
    return PaginatedAPIResponse(
        data=[DonationResponse.model_validate(d) for d in items],
        message="History retrieved",
        pagination=_build_pagination(params.page, params.size, total),
    )
