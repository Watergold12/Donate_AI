"""
Matching Engine API.
GET /matching-engine/rank/{donation_id}
  Returns the top-N NGOs ranked by score for a given donation.
"""
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.exceptions import NotFoundError, AuthorizationError
from app.database import get_db
from app.matching.engine import get_engine
from app.models.donation import Donation
from app.models.donor import DonorProfile
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import APIResponse

router = APIRouter(prefix="/matching-engine", tags=["Matching Engine"])

@router.get(
    "/rank/{donation_id}",
    response_model=APIResponse[List[dict]],
    summary="Rank top-N NGOs for a donation",
    description=(
        "Returns up to top_n NGOs ranked by the matching engine. "
        "Factors: item type (30%), quantity (20%), priority (15%), "
        "distance (15%), urgency (20%). "
        "Future AI/ML scorers can be injected via the BaseScorer interface."
    ),
)
def rank_ngo_matches(
    donation_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    top_n: int   = Query(default=5, ge=1, le=20, description="Max results to return"),
    threshold: float = Query(default=0.30, ge=0.0, le=1.0, description="Min score"),
):
    donation = db.query(Donation).filter(
        Donation.id == donation_id,
        Donation.deleted_at.is_(None),
    ).first()
    if not donation:
        raise NotFoundError("Donation")

    # Donors can only rank their own donations; admins can rank any
    if current_user.role == UserRole.donor:
        donor = db.query(DonorProfile).filter(
            DonorProfile.user_id == current_user.id
        ).first()
        if not donor or donation.donor_id != donor.id:
            raise AuthorizationError("You do not own this donation")

    donor_city:  Optional[str] = donation.donor.city  if donation.donor else None
    donor_state: Optional[str] = donation.donor.state if donation.donor else None

    candidates = get_engine().rank(
        db=db,
        donation=donation,
        donor_city=donor_city,
        donor_state=donor_state,
        top_n=top_n,
        threshold=threshold,
    )

    return APIResponse.ok(
        [c.__dict__ for c in candidates],
        f"Ranked {len(candidates)} NGO(s) for donation {donation_id}",
    )
