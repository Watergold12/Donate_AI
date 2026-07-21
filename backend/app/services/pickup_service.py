"""Pickup service — scheduling, status transitions, and listing."""
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessLogicError, NotFoundError, AuthorizationError
from app.models.donation import Donation
from app.models.donor import DonorProfile
from app.models.enums import AuditAction, DonationStatus, MatchStatus, PickupStatus
from app.models.match import Match
from app.models.ngo import NGOProfile
from app.models.pickup import PickupRequest
from app.models.user import User
from app.schemas.pickup import PickupCreate, PickupStatusUpdate, PickupUpdate
from app.utils.audit import log_action
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)

VALID_PICKUP_TRANSITIONS = {
    PickupStatus.scheduled:  [PickupStatus.confirmed, PickupStatus.in_transit, PickupStatus.collected, PickupStatus.delivered, PickupStatus.completed, PickupStatus.failed, PickupStatus.cancelled],
    PickupStatus.confirmed:  [PickupStatus.in_transit, PickupStatus.collected, PickupStatus.delivered, PickupStatus.completed, PickupStatus.failed, PickupStatus.cancelled],
    PickupStatus.in_transit: [PickupStatus.collected, PickupStatus.delivered, PickupStatus.completed, PickupStatus.failed, PickupStatus.cancelled],
    PickupStatus.collected:  [PickupStatus.delivered, PickupStatus.completed, PickupStatus.failed, PickupStatus.cancelled],
    PickupStatus.delivered:  [PickupStatus.completed, PickupStatus.failed, PickupStatus.cancelled],
    PickupStatus.completed:  [],
    PickupStatus.failed:     [],
    PickupStatus.cancelled:  [],
}


def create_pickup(db: Session, user: User, payload: PickupCreate, request=None) -> PickupRequest:
    # Verify match exists and is accepted
    if payload.match_id:
        match = db.query(Match).filter(Match.id == payload.match_id).first()
        if not match:
            raise NotFoundError("Match")
        if match.status not in (MatchStatus.accepted, MatchStatus.proposed):
            raise BusinessLogicError("Pickup can only be created for active matches")
        if match.status == MatchStatus.proposed:
            match.status = MatchStatus.accepted

    # Check no existing pickup for this donation
    existing = db.query(PickupRequest).filter(
        PickupRequest.donation_id == payload.donation_id
    ).first()
    if existing:
        raise BusinessLogicError("A pickup already exists for this donation")

    pickup = PickupRequest(
        donation_id=payload.donation_id,
        ngo_id=payload.ngo_id,
        match_id=payload.match_id,
        scheduled_at=payload.scheduled_at,
        pickup_address=payload.pickup_address,
        pickup_city=payload.pickup_city,
        contact_phone=payload.contact_phone,
        notes=payload.notes,
        status=PickupStatus.scheduled,
    )
    db.add(pickup)

    # Update donation status
    donation = db.query(Donation).filter(Donation.id == payload.donation_id).first()
    if donation and donation.status == DonationStatus.matched:
        donation.status = DonationStatus.scheduled

    db.flush()
    log_action(db, AuditAction.CREATE, "pickup", pickup.id, actor_id=user.id,
               new_data={"scheduled_at": str(payload.scheduled_at)}, request=request)
    db.commit()
    db.refresh(pickup)

    try:
        from app.services.notification_service import notify_pickup_scheduled
        notify_pickup_scheduled(db, pickup)
    except Exception as exc:
        logger.error("notify_pickup_scheduled failed: %s", exc)

    return pickup


def get_pickup(db: Session, pickup_id: UUID) -> PickupRequest:
    pickup = db.query(PickupRequest).filter(PickupRequest.id == pickup_id).first()
    if not pickup:
        raise NotFoundError("Pickup")
    return pickup


def update_pickup(db: Session, user: User, pickup_id: UUID,
                  payload: PickupUpdate, request=None) -> PickupRequest:
    pickup = get_pickup(db, pickup_id)
    if pickup.status != PickupStatus.scheduled:
        raise BusinessLogicError("Only scheduled pickups can be updated")
    old_data = {"scheduled_at": str(pickup.scheduled_at)}
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(pickup, field, val)
    log_action(db, AuditAction.UPDATE, "pickup", pickup.id, actor_id=user.id,
               old_data=old_data, request=request)
    db.commit()
    db.refresh(pickup)
    return pickup


def update_status(db: Session, user: User, pickup_id: UUID,
                  payload: PickupStatusUpdate, request=None) -> PickupRequest:
    pickup = get_pickup(db, pickup_id)
    allowed = VALID_PICKUP_TRANSITIONS.get(pickup.status, [])
    if payload.status not in allowed:
        raise BusinessLogicError(
            f"Cannot transition pickup from '{pickup.status}' to '{payload.status}'"
        )
    old_status = pickup.status
    pickup.status = payload.status
    now = datetime.now(timezone.utc)
    donation = pickup.donation

    # Sync donation status with pickup pipeline (event-driven)
    if payload.status == PickupStatus.confirmed:
        if donation and donation.status in (
            DonationStatus.matched, DonationStatus.accepted, DonationStatus.scheduled
        ):
            donation.status = DonationStatus.pickup_scheduled

    elif payload.status == PickupStatus.collected:
        pickup.completed_at = now
        if donation:
            donation.status = DonationStatus.collected

    elif payload.status == PickupStatus.delivered:
        if donation:
            donation.status = DonationStatus.delivered

    elif payload.status == PickupStatus.completed:
        pickup.completed_at = now
        if donation:
            donation.status = DonationStatus.completed
            donation.completed_at = now

    elif payload.status in (PickupStatus.failed, PickupStatus.cancelled):
        pickup.completed_at = now

    log_action(db, AuditAction.UPDATE, "pickup", pickup.id, actor_id=user.id,
               old_data={"status": old_status}, new_data={"status": payload.status}, request=request)
    db.commit()
    db.refresh(pickup)

    # Event-driven notifications
    try:
        if payload.status == PickupStatus.confirmed:
            from app.services.notification_service import notify_pickup_confirmed
            notify_pickup_confirmed(db, pickup)
        elif payload.status == PickupStatus.collected:
            from app.services.notification_service import notify_pickup_collected
            notify_pickup_collected(db, pickup)
        elif payload.status == PickupStatus.delivered:
            from app.services.notification_service import notify_pickup_delivered
            notify_pickup_delivered(db, pickup)
        elif payload.status == PickupStatus.completed:
            from app.services.notification_service import notify_pickup_completed
            notify_pickup_completed(db, pickup)
    except Exception as exc:
        logger.error("Pickup notification failed for status %s: %s", payload.status, exc)

    return pickup


def list_donor_pickups(db: Session, user: User, params: PaginationParams):
    donor = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
    if not donor:
        raise NotFoundError("Donor profile")
    query = (
        db.query(PickupRequest)
        .join(Donation, PickupRequest.donation_id == Donation.id)
        .filter(Donation.donor_id == donor.id)
        .order_by(PickupRequest.scheduled_at.asc())
    )
    return paginate(query, params)


def list_ngo_pickups(db: Session, user: User, params: PaginationParams):
    ngo = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
    if not ngo:
        raise NotFoundError("NGO profile")
    query = (
        db.query(PickupRequest)
        .filter(PickupRequest.ngo_id == ngo.id)
        .order_by(PickupRequest.scheduled_at.asc())
    )
    return paginate(query, params)
