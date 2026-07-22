"""
NGO service — profile management, demand CRUD, match handling.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationError, BusinessLogicError, NotFoundError
from app.models.enums import AuditAction, DemandUrgency, DonationStatus, ItemCategory, MatchStatus
from app.models.match import Match
from app.models.ngo import NGOProfile
from app.models.ngo_demand import NGODemand
from app.models.user import User
from app.schemas.ngo import NGOProfileUpdate
from app.schemas.ngo_demand import NGODemandCreate, NGODemandUpdate
from app.utils.audit import log_action
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)


def _get_ngo_profile(db: Session, user: User) -> NGOProfile:
    profile = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
    if not profile:
        raise NotFoundError("NGO profile")
    return profile


def get_profile(db: Session, user: User) -> NGOProfile:
    return _get_ngo_profile(db, user)


def update_profile(db: Session, user: User, payload: NGOProfileUpdate, request=None) -> NGOProfile:
    profile = _get_ngo_profile(db, user)
    old_data = {"org_name": profile.org_name, "city": profile.city}
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, val)
    log_action(db, AuditAction.UPDATE, "ngo_profile", profile.id,
               actor_id=user.id, old_data=old_data, request=request)
    db.commit()
    db.refresh(profile)
    return profile


def create_demand(db: Session, user: User, payload: NGODemandCreate, request=None) -> NGODemand:
    profile = _get_ngo_profile(db, user)
    if not profile.is_verified:
        raise BusinessLogicError("NGO must be verified before creating demands")
    demand = NGODemand(
        ngo_id=profile.id,
        item_category=payload.item_category,
        item_name=payload.item_name,
        quantity_needed=payload.quantity_needed,
        urgency_level=payload.urgency_level,
        description=payload.description,
        expires_at=payload.expires_at,
        is_active=True,
    )
    db.add(demand)
    db.flush()
    log_action(db, AuditAction.CREATE, "ngo_demand", demand.id, actor_id=user.id,
               new_data={"category": demand.item_category, "qty": demand.quantity_needed}, request=request)
    db.commit()
    db.refresh(demand)
    # Trigger matching for new demand
    try:
        from app.services.matching_service import run_matching_for_demand
        run_matching_for_demand(db, demand)
    except Exception as exc:
        logger.error("Matching failed for demand %s: %s", demand.id, exc)
    return demand


def update_demand(db: Session, user: User, demand_id: UUID,
                  payload: NGODemandUpdate, request=None) -> NGODemand:
    profile = _get_ngo_profile(db, user)
    demand = db.query(NGODemand).filter(
        NGODemand.id == demand_id, NGODemand.ngo_id == profile.id
    ).first()
    if not demand:
        raise NotFoundError("NGO demand")
    old_data = {"quantity_needed": demand.quantity_needed, "urgency_level": demand.urgency_level}
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(demand, field, val)
    log_action(db, AuditAction.UPDATE, "ngo_demand", demand.id,
               actor_id=user.id, old_data=old_data, request=request)
    db.commit()
    db.refresh(demand)
    try:
        from app.services.matching_service import run_matching_for_demand
        run_matching_for_demand(db, demand)
    except Exception as exc:
        logger.error("Matching failed for demand %s: %s", demand.id, exc)
    return demand


def delete_demand(db: Session, user: User, demand_id: UUID, request=None) -> None:
    profile = _get_ngo_profile(db, user)
    demand = db.query(NGODemand).filter(
        NGODemand.id == demand_id, NGODemand.ngo_id == profile.id
    ).first()
    if not demand:
        raise NotFoundError("NGO demand")
    demand.is_active = False
    log_action(db, AuditAction.DELETE, "ngo_demand", demand.id, actor_id=user.id,
               old_data={"is_active": True}, request=request)
    db.commit()


def list_demands(db: Session, user: User, params: PaginationParams,
                 active_only: bool = True):
    profile = _get_ngo_profile(db, user)
    query = db.query(NGODemand).filter(NGODemand.ngo_id == profile.id)
    if active_only:
        query = query.filter(NGODemand.is_active.is_(True))
    query = query.order_by(NGODemand.created_at.desc())
    return paginate(query, params)


def list_matches(db: Session, user: User, params: PaginationParams,
                 status_filter: Optional[MatchStatus] = None):
    profile = _get_ngo_profile(db, user)
    query = db.query(Match).filter(Match.ngo_id == profile.id)
    if status_filter:
        query = query.filter(Match.status == status_filter)
    query = query.order_by(Match.proposed_at.desc())
    return paginate(query, params)


def submit_verification_documents(db: Session, user: User, doc_path: str, request=None) -> NGOProfile:
    profile = _get_ngo_profile(db, user)
    profile.verification_doc_path = doc_path
    profile.verification_status = "pending"
    profile.verification_submitted_at = datetime.now(timezone.utc)
    profile.rejection_reason = None
    log_action(db, AuditAction.UPDATE, "ngo_profile", profile.id, actor_id=user.id,
               new_data={"verification_status": "pending", "doc_path": doc_path}, request=request)
    db.commit()
    db.refresh(profile)
    return profile


def accept_match(db: Session, user: User, match_id: UUID, request=None) -> Match:
    profile = _get_ngo_profile(db, user)
    if not profile.is_verified:
        raise BusinessLogicError("NGO must be verified by an administrator before accepting matches")
    match = db.query(Match).filter(
        Match.id == match_id, Match.ngo_id == profile.id
    ).first()
    if not match:
        raise NotFoundError("Match")
    if match.status != MatchStatus.proposed:
        raise BusinessLogicError(f"Cannot accept a match with status '{match.status}'")
    now = datetime.now(timezone.utc)
    if match.expires_at < now:
        match.status = MatchStatus.expired
        db.commit()
        raise BusinessLogicError("This match has expired")
    match.status = MatchStatus.accepted
    match.responded_at = now
    # Update donation status
    donation = match.donation
    if donation and donation.status == DonationStatus.pending_match:
        donation.status = DonationStatus.matched
    log_action(db, AuditAction.ACCEPT, "match", match.id, actor_id=user.id,
               old_data={"status": "proposed"}, new_data={"status": "accepted"}, request=request)
    db.commit()
    db.refresh(match)
    # Send notifications
    try:
        from app.services.notification_service import notify_match_accepted
        notify_match_accepted(db, match)
    except Exception as exc:
        logger.error("Notification failed for match %s: %s", match_id, exc)
    return match


def reject_match(db: Session, user: User, match_id: UUID,
                 rejection_reason: Optional[str] = None, request=None) -> Match:
    profile = _get_ngo_profile(db, user)
    match = db.query(Match).filter(
        Match.id == match_id, Match.ngo_id == profile.id
    ).first()
    if not match:
        raise NotFoundError("Match")
    if match.status != MatchStatus.proposed:
        raise BusinessLogicError(f"Cannot reject a match with status '{match.status}'")
    match.status = MatchStatus.rejected
    match.responded_at = datetime.now(timezone.utc)
    match.rejection_reason = rejection_reason
    log_action(db, AuditAction.REJECT, "match", match.id, actor_id=user.id,
               old_data={"status": "proposed"}, new_data={"status": "rejected", "reason": rejection_reason},
               request=request)
    db.commit()
    db.refresh(match)
    try:
        from app.services.notification_service import notify_match_rejected
        notify_match_rejected(db, match)
    except Exception as exc:
        logger.error("Notification failed for match %s: %s", match_id, exc)
    return match


def get_ngo_analytics(db: Session, user: User) -> dict:
    profile = _get_ngo_profile(db, user)
    total_demands = db.query(NGODemand).filter(NGODemand.ngo_id == profile.id).count()
    active_demands = db.query(NGODemand).filter(
        NGODemand.ngo_id == profile.id, NGODemand.is_active.is_(True)
    ).count()
    total_matches = db.query(Match).filter(Match.ngo_id == profile.id).count()
    accepted_matches = db.query(Match).filter(
        Match.ngo_id == profile.id, Match.status == MatchStatus.accepted
    ).count()
    from app.models.pickup import PickupRequest
    from app.models.enums import PickupStatus
    pickups_completed = db.query(PickupRequest).filter(
        PickupRequest.ngo_id == profile.id,
        PickupRequest.status == PickupStatus.completed,
    ).count()
    return {
        "total_demands": total_demands,
        "active_demands": active_demands,
        "total_matches": total_matches,
        "accepted_matches": accepted_matches,
        "pickups_completed": pickups_completed,
    }
