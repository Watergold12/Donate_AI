"""Analytics service — role-aware dashboard stats and trend data."""
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.donation import Donation, DonationItem
from app.models.donor import DonorProfile
from app.models.enums import DonationStatus, ItemCategory, MatchStatus, PickupStatus, UserRole
from app.models.match import Match
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand
from app.models.pickup import PickupRequest
from app.models.user import User

logger = logging.getLogger(__name__)


def get_summary(db: Session, user: User) -> dict:
    """Return role-aware summary statistics."""
    if user.role == UserRole.donor:
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
        if not donor:
            return {"total_donations": 0, "completed_donations": 0, "pending_donations": 0, "total_items_donated": 0}
        total = db.query(Donation).filter(Donation.donor_id == donor.id, Donation.deleted_at.is_(None)).count()
        completed = db.query(Donation).filter(Donation.donor_id == donor.id, Donation.status == DonationStatus.completed).count()
        pending = db.query(Donation).filter(Donation.donor_id == donor.id, Donation.status.in_([DonationStatus.draft, DonationStatus.pending_match, DonationStatus.matched])).count()
        total_items = db.query(func.sum(DonationItem.quantity)).join(Donation).filter(Donation.donor_id == donor.id, DonationItem.is_confirmed.is_(True)).scalar() or 0
        return {"total_donations": total, "completed_donations": completed, "pending_donations": pending, "total_items_donated": int(total_items)}

    elif user.role == UserRole.ngo:
        ngo = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
        if not ngo:
            return {"total_demands": 0, "active_demands": 0, "total_matches": 0, "accepted_matches": 0, "pickups_completed": 0}
        total_demands = db.query(NGODemand).filter(NGODemand.ngo_id == ngo.id).count()
        active_demands = db.query(NGODemand).filter(NGODemand.ngo_id == ngo.id, NGODemand.is_active.is_(True)).count()
        total_matches = db.query(Match).filter(Match.ngo_id == ngo.id).count()
        accepted = db.query(Match).filter(Match.ngo_id == ngo.id, Match.status == MatchStatus.accepted).count()
        pickups_done = db.query(PickupRequest).filter(PickupRequest.ngo_id == ngo.id, PickupRequest.status == PickupStatus.completed).count()
        return {"total_demands": total_demands, "active_demands": active_demands, "total_matches": total_matches, "accepted_matches": accepted, "pickups_completed": pickups_done}

    else:  # admin
        total_users = db.query(User).filter(User.deleted_at.is_(None)).count()
        total_donors = db.query(User).filter(User.role == UserRole.donor, User.deleted_at.is_(None)).count()
        total_ngos = db.query(User).filter(User.role == UserRole.ngo, User.deleted_at.is_(None)).count()
        pending_verif = db.query(NGOProfile).filter(NGOProfile.is_verified.is_(False)).count()
        total_donations = db.query(Donation).filter(Donation.deleted_at.is_(None)).count()
        total_matches = db.query(Match).count()
        accepted_matches = db.query(Match).filter(Match.status == MatchStatus.accepted).count()
        rate = round((accepted_matches / total_matches * 100), 1) if total_matches > 0 else 0.0
        return {"total_users": total_users, "total_donors": total_donors, "total_ngos": total_ngos,
                "pending_ngo_verifications": pending_verif, "total_donations": total_donations,
                "total_matches": total_matches, "match_success_rate": rate}


def get_donation_trend(db: Session, user: User, days: int = 30) -> List[dict]:
    """Donation volume grouped by day for the past N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(func.date(Donation.created_at).label("date"), func.count(Donation.id).label("count"))
    if user.role == UserRole.donor:
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
        if donor:
            query = query.filter(Donation.donor_id == donor.id)
    query = query.filter(Donation.created_at >= since, Donation.deleted_at.is_(None))
    query = query.group_by(func.date(Donation.created_at)).order_by(func.date(Donation.created_at))
    return [{"date": str(row.date), "count": row.count} for row in query.all()]


def get_category_breakdown(db: Session, user: User) -> List[dict]:
    """Item count broken down by category."""
    query = db.query(DonationItem.category, func.sum(DonationItem.quantity).label("count"))
    query = query.filter(DonationItem.is_confirmed.is_(True))
    if user.role == UserRole.donor:
        donor = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
        if donor:
            query = query.join(Donation).filter(Donation.donor_id == donor.id)
    query = query.group_by(DonationItem.category)
    rows = query.all()
    total = sum(r.count for r in rows) or 1
    return [{"category": r.category, "count": int(r.count), "percentage": round(r.count / total * 100, 1)} for r in rows]


def get_matching_rate(db: Session, days: int = 30) -> List[dict]:
    """Match acceptance rate grouped by day."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.query(func.date(Match.proposed_at).label("date"),
                    func.count(Match.id).label("total"),
                    func.sum(func.cast(Match.status == MatchStatus.accepted, db.bind.dialect.type_descriptor(func.count(Match.id).type).__class__)).label("accepted")
                    ).filter(Match.proposed_at >= since).group_by(func.date(Match.proposed_at)).order_by(func.date(Match.proposed_at)).all()
    result = []
    for row in rows:
        accepted = int(row.accepted or 0)
        total = int(row.total)
        result.append({"date": str(row.date), "total_matches": total, "accepted": accepted,
                        "rate": round(accepted / total * 100, 1) if total > 0 else 0.0})
    return result


def get_pickup_stats(db: Session, user: Optional[User] = None) -> dict:
    """Pickup completion statistics."""
    query = db.query(PickupRequest)
    if user and user.role == UserRole.ngo:
        ngo = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
        if ngo:
            query = query.filter(PickupRequest.ngo_id == ngo.id)
    total = query.count()
    completed = query.filter(PickupRequest.status == PickupStatus.completed).count()
    failed = query.filter(PickupRequest.status == PickupStatus.failed).count()
    rate = round(completed / total * 100, 1) if total > 0 else 0.0
    return {"total_scheduled": total, "completed": completed, "failed": failed, "completion_rate": rate}
