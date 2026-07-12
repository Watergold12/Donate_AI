"""
Donation service — all donation business logic.
Handles donation lifecycle: create → add items → submit → match → complete/cancel.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessLogicError, NotFoundError, AuthorizationError
from app.models.donation import Donation, DonationItem
from app.models.donor import DonorProfile
from app.models.enums import AuditAction, DonationStatus
from app.models.match import Match
from app.models.user import User
from app.schemas.donation import DonationCreate, DonationItemCreate, DonationItemUpdate, DonationUpdate
from app.utils.audit import log_action
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)

# Valid status transitions
VALID_TRANSITIONS = {
    DonationStatus.draft: [DonationStatus.pending_match, DonationStatus.cancelled],
    DonationStatus.pending_match: [DonationStatus.matched, DonationStatus.cancelled],
    DonationStatus.matched: [DonationStatus.scheduled, DonationStatus.cancelled],
    DonationStatus.scheduled: [DonationStatus.completed, DonationStatus.cancelled],
    DonationStatus.completed: [],
    DonationStatus.cancelled: [],
}


def _get_donor_profile(db: Session, user: User) -> DonorProfile:
    profile = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
    if not profile:
        raise NotFoundError("Donor profile")
    return profile


def _get_donation_or_404(db: Session, donation_id: UUID) -> Donation:
    donation = db.query(Donation).filter(
        Donation.id == donation_id,
        Donation.deleted_at.is_(None),
    ).first()
    if not donation:
        raise NotFoundError("Donation")
    return donation


def _assert_owns_donation(donation: Donation, donor_profile: DonorProfile) -> None:
    if donation.donor_id != donor_profile.id:
        raise AuthorizationError("You do not own this donation")


def _transition_status(donation: Donation, new_status: DonationStatus) -> None:
    allowed = VALID_TRANSITIONS.get(donation.status, [])
    if new_status not in allowed:
        raise BusinessLogicError(
            f"Cannot transition donation from '{donation.status}' to '{new_status}'"
        )
    donation.status = new_status


def create_donation(db: Session, user: User, payload: DonationCreate, request=None) -> Donation:
    """Create a new donation in draft status."""
    donor = _get_donor_profile(db, user)
    donation = Donation(donor_id=donor.id, notes=payload.notes, status=DonationStatus.draft)
    db.add(donation)
    db.flush()
    log_action(db, AuditAction.CREATE, "donation", donation.id, actor_id=user.id,
               new_data={"status": "draft"}, request=request)
    db.commit()
    db.refresh(donation)
    return donation


def get_donation(db: Session, user: User, donation_id: UUID) -> Donation:
    """Get a single donation — donor sees only their own."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    return donation


def update_donation(db: Session, user: User, donation_id: UUID,
                    payload: DonationUpdate, request=None) -> Donation:
    """Update notes on a draft donation."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    if donation.status != DonationStatus.draft:
        raise BusinessLogicError("Only draft donations can be updated")
    old_data = {"notes": donation.notes}
    if payload.notes is not None:
        donation.notes = payload.notes
    log_action(db, AuditAction.UPDATE, "donation", donation.id, actor_id=user.id,
               old_data=old_data, new_data={"notes": donation.notes}, request=request)
    db.commit()
    db.refresh(donation)
    return donation


def submit_donation(db: Session, user: User, donation_id: UUID, request=None) -> Donation:
    """
    Submit a donation for matching.
    Transitions status: draft → pending_match.
    Triggers the matching engine (import is lazy to avoid circular deps).
    """
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    if donation.total_items == 0:
        raise BusinessLogicError("Cannot submit a donation with no items")
    old_status = donation.status
    _transition_status(donation, DonationStatus.pending_match)
    donation.submitted_at = datetime.now(timezone.utc)
    log_action(db, AuditAction.UPDATE, "donation", donation.id, actor_id=user.id,
               old_data={"status": old_status}, new_data={"status": "pending_match"}, request=request)
    db.commit()
    db.refresh(donation)
    # Trigger matching engine after commit
    try:
        from app.services.matching_service import run_matching_for_donation
        run_matching_for_donation(db, donation)
    except Exception as exc:
        logger.error("Matching engine failed for donation %s: %s", donation_id, exc)
    return donation


def cancel_donation(db: Session, user: User, donation_id: UUID, request=None) -> Donation:
    """Cancel a donation (only if not completed)."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    old_status = donation.status
    _transition_status(donation, DonationStatus.cancelled)
    log_action(db, AuditAction.CANCEL, "donation", donation.id, actor_id=user.id,
               old_data={"status": old_status}, new_data={"status": "cancelled"}, request=request)
    db.commit()
    db.refresh(donation)
    return donation


def list_donations(db: Session, user: User, params: PaginationParams,
                   status_filter: Optional[DonationStatus] = None):
    """List all donations for the authenticated donor with optional status filter."""
    donor = _get_donor_profile(db, user)
    query = db.query(Donation).filter(
        Donation.donor_id == donor.id,
        Donation.deleted_at.is_(None),
    )
    if status_filter:
        query = query.filter(Donation.status == status_filter)
    query = query.order_by(Donation.created_at.desc())
    return paginate(query, params)


def add_item(db: Session, user: User, donation_id: UUID,
             payload: DonationItemCreate, request=None) -> DonationItem:
    """Add an item to a draft donation."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    if donation.status != DonationStatus.draft:
        raise BusinessLogicError("Items can only be added to draft donations")
    item = DonationItem(
        donation_id=donation.id,
        item_name=payload.item_name,
        category=payload.category,
        quantity=payload.quantity,
        condition=payload.condition,
        ai_detected=payload.ai_detected,
        confidence_score=payload.confidence_score,
        image_path=payload.image_path,
        is_confirmed=True,
    )
    db.add(item)
    donation.total_items += payload.quantity
    log_action(db, AuditAction.CREATE, "donation_item", item.id, actor_id=user.id,
               new_data={"item_name": item.item_name, "category": item.category}, request=request)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, user: User, donation_id: UUID, item_id: UUID,
                payload: DonationItemUpdate, request=None) -> DonationItem:
    """Update an item in a draft donation."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    if donation.status != DonationStatus.draft:
        raise BusinessLogicError("Items can only be modified in draft donations")
    item = db.query(DonationItem).filter(
        DonationItem.id == item_id,
        DonationItem.donation_id == donation_id,
    ).first()
    if not item:
        raise NotFoundError("Donation item")
    old_qty = item.quantity
    if payload.item_name is not None:
        item.item_name = payload.item_name
    if payload.category is not None:
        item.category = payload.category
    if payload.quantity is not None:
        donation.total_items = donation.total_items - old_qty + payload.quantity
        item.quantity = payload.quantity
    if payload.condition is not None:
        item.condition = payload.condition
    if payload.is_confirmed is not None:
        item.is_confirmed = payload.is_confirmed
    log_action(db, AuditAction.UPDATE, "donation_item", item.id, actor_id=user.id,
               new_data={"item_name": item.item_name}, request=request)
    db.commit()
    db.refresh(item)
    return item


def remove_item(db: Session, user: User, donation_id: UUID,
                item_id: UUID, request=None) -> None:
    """Remove an item from a draft donation (soft-remove via is_confirmed=False)."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    if donation.status != DonationStatus.draft:
        raise BusinessLogicError("Items can only be removed from draft donations")
    item = db.query(DonationItem).filter(
        DonationItem.id == item_id,
        DonationItem.donation_id == donation_id,
        DonationItem.is_confirmed.is_(True),
    ).first()
    if not item:
        raise NotFoundError("Donation item")
    donation.total_items = max(0, donation.total_items - item.quantity)
    item.is_confirmed = False
    log_action(db, AuditAction.DELETE, "donation_item", item.id, actor_id=user.id,
               old_data={"item_name": item.item_name}, request=request)
    db.commit()


def get_donation_matches(db: Session, user: User, donation_id: UUID) -> List[Match]:
    """Get all matches for a specific donation."""
    donation = _get_donation_or_404(db, donation_id)
    donor = _get_donor_profile(db, user)
    _assert_owns_donation(donation, donor)
    return db.query(Match).filter(Match.donation_id == donation_id).all()
