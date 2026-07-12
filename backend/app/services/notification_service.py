"""
Notification service — create, list, mark-read, unread count.
Also exports convenience helpers called by other services:
  notify_match_found, notify_match_accepted, notify_match_rejected,
  notify_pickup_scheduled, notify_pickup_completed, notify_ngo_verified
"""
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    reference_id: Optional[UUID] = None,
    reference_type: Optional[str] = None,
) -> Notification:
    """Create and persist a notification. Does NOT commit — caller must commit."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        is_read=False,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    db.add(notif)
    return notif


def list_notifications(db: Session, user: User, params: PaginationParams):
    """Return paginated notifications for the current user, newest first."""
    query = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    )
    return paginate(query, params)


def mark_read(db: Session, user: User, notification_id: UUID) -> Notification:
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user.id,
    ).first()
    if not notif:
        raise NotFoundError("Notification")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_read(db: Session, user: User) -> int:
    """Mark all unread notifications as read. Returns count updated."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read.is_(False))
        .update({"is_read": True}, synchronize_session="fetch")
    )
    db.commit()
    return count


def get_unread_count(db: Session, user: User) -> int:
    """Return count of unread notifications for the user."""
    return db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read.is_(False),
    ).count()


# ── Domain-specific notification helpers ─────────────────────────────────────

def notify_match_found(db: Session, donation_id: UUID, donor_user_id: UUID) -> None:
    """Notify donor that a match was found for their donation."""
    try:
        notif = create_notification(
            db, donor_user_id,
            NotificationType.match_found,
            "Match Found!",
            "A matching NGO has been found for your donation.",
            reference_id=donation_id,
            reference_type="donation",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_match_found failed: %s", exc)
        db.rollback()


def notify_match_accepted(db: Session, match) -> None:
    """Notify donor that the NGO accepted the match."""
    try:
        donor_user_id = match.donation.donor.user_id
        notif = create_notification(
            db, donor_user_id,
            NotificationType.match_accepted,
            "Donation Accepted",
            f"An NGO has accepted your donation. A pickup will be scheduled.",
            reference_id=match.id,
            reference_type="match",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_match_accepted failed: %s", exc)
        db.rollback()


def notify_match_rejected(db: Session, match) -> None:
    """Notify donor that the NGO rejected the match."""
    try:
        donor_user_id = match.donation.donor.user_id
        notif = create_notification(
            db, donor_user_id,
            NotificationType.match_rejected,
            "Match Declined",
            "An NGO has declined your donation match. We will look for another match.",
            reference_id=match.id,
            reference_type="match",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_match_rejected failed: %s", exc)
        db.rollback()


def notify_pickup_scheduled(db: Session, pickup) -> None:
    """Notify both donor and NGO that a pickup has been scheduled."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        create_notification(
            db, donor_user_id,
            NotificationType.pickup_scheduled,
            "Pickup Scheduled",
            f"Your donation pickup is scheduled for {pickup.scheduled_at.strftime('%Y-%m-%d %H:%M')} UTC.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        ngo_user_id = pickup.ngo.user_id
        create_notification(
            db, ngo_user_id,
            NotificationType.pickup_scheduled,
            "Pickup Scheduled",
            f"A pickup has been scheduled for {pickup.scheduled_at.strftime('%Y-%m-%d %H:%M')} UTC.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_pickup_scheduled failed: %s", exc)
        db.rollback()


def notify_pickup_completed(db: Session, pickup) -> None:
    """Notify donor and NGO that a pickup has been completed."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        create_notification(
            db, donor_user_id,
            NotificationType.pickup_completed,
            "Pickup Completed",
            "Your donation has been successfully picked up. Thank you!",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_pickup_completed failed: %s", exc)
        db.rollback()


def notify_ngo_verified(db: Session, ngo_user_id: UUID, ngo_profile_id: UUID) -> None:
    """Notify NGO that their account has been verified by admin."""
    try:
        create_notification(
            db, ngo_user_id,
            NotificationType.ngo_verified,
            "Account Verified",
            "Your NGO account has been verified. You can now post demands and receive donations.",
            reference_id=ngo_profile_id,
            reference_type="ngo",
        )
        db.commit()
    except Exception as exc:
        logger.error("notify_ngo_verified failed: %s", exc)
        db.rollback()
