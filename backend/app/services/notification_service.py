"""
Notification service - create, list, mark-read, unread count, and multi-channel delivery.

The in-app notification remains the source of truth. Optional delivery channels
can be enabled through settings for email, SMS, and WhatsApp without breaking
the donation workflow if those integrations are unavailable.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.mime.text import MIMEText
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import NotFoundError
from app.models.donor import DonorProfile
from app.models.enums import NotificationChannel, NotificationType, UserRole
from app.models.ngo import NGOProfile
from app.models.notification import Notification
from app.models.user import User
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DeliveryTarget:
    email: Optional[str]
    phone: Optional[str]


def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    reference_id: Optional[UUID] = None,
    reference_type: Optional[str] = None,
) -> Notification:
    """Create and persist an in-app notification. Caller handles commit."""
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


def _get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def _get_delivery_target(db: Session, user: User) -> DeliveryTarget:
    phone = None
    if user.role == UserRole.donor:
        profile = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
        phone = profile.phone if profile else None
    elif user.role == UserRole.ngo:
        profile = db.query(NGOProfile).filter(NGOProfile.user_id == user.id).first()
        phone = profile.contact_phone if profile else None
    return DeliveryTarget(email=user.email, phone=phone)


def _send_email_notification(recipient_email: str, title: str, message: str) -> bool:
    if not settings.notification_email_enabled:
        return False
    if not settings.notification_smtp_host or not settings.notification_smtp_from_email:
        logger.info("Email notification skipped: SMTP configuration is incomplete")
        return False

    mime = MIMEText(message)
    mime["Subject"] = title
    mime["From"] = settings.notification_smtp_from_email
    mime["To"] = recipient_email

    context = ssl.create_default_context()
    with smtplib.SMTP(
        settings.notification_smtp_host,
        settings.notification_smtp_port,
        timeout=settings.notification_delivery_timeout_seconds,
    ) as server:
        if settings.notification_smtp_use_tls:
            server.starttls(context=context)
        if settings.notification_smtp_username:
            server.login(settings.notification_smtp_username, settings.notification_smtp_password)
        server.send_message(mime)
    return True


def _send_webhook_notification(
    url: str,
    channel: NotificationChannel,
    recipient: DeliveryTarget,
    title: str,
    message: str,
    notification_type: NotificationType,
    reference_id: Optional[UUID],
    reference_type: Optional[str],
) -> bool:
    if not url:
        logger.info("%s notification skipped: webhook URL is not configured", channel.value)
        return False

    payload = {
        "channel": channel.value,
        "recipient_email": recipient.email,
        "recipient_phone": recipient.phone,
        "title": title,
        "message": message,
        "type": notification_type.value,
        "reference_id": str(reference_id) if reference_id else None,
        "reference_type": reference_type,
    }

    with httpx.Client(timeout=settings.notification_delivery_timeout_seconds) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
    return True


def _deliver_optional_channels(
    db: Session,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    reference_id: Optional[UUID] = None,
    reference_type: Optional[str] = None,
) -> None:
    user = _get_user(db, user_id)
    if not user:
        logger.warning("Notification delivery skipped: user %s not found", user_id)
        return

    target = _get_delivery_target(db, user)
    if settings.notification_email_enabled and target.email:
        try:
            if _send_email_notification(target.email, title, message):
                logger.info(
                    "Notification delivered via email | user=%s | type=%s",
                    user_id, notification_type.value,
                )
        except Exception as exc:
            logger.error(
                "Email notification failed | user=%s | type=%s | error=%s",
                user_id, notification_type.value, exc,
            )

    if settings.notification_sms_enabled and target.phone:
        try:
            if _send_webhook_notification(
                settings.notification_sms_webhook_url,
                NotificationChannel.sms,
                target,
                title,
                message,
                notification_type,
                reference_id,
                reference_type,
            ):
                logger.info(
                    "Notification delivered via sms | user=%s | type=%s",
                    user_id, notification_type.value,
                )
        except Exception as exc:
            logger.error(
                "SMS notification failed | user=%s | type=%s | error=%s",
                user_id, notification_type.value, exc,
            )

    if settings.notification_whatsapp_enabled and target.phone:
        try:
            if _send_webhook_notification(
                settings.notification_whatsapp_webhook_url,
                NotificationChannel.whatsapp,
                target,
                title,
                message,
                notification_type,
                reference_id,
                reference_type,
            ):
                logger.info(
                    "Notification delivered via whatsapp | user=%s | type=%s",
                    user_id, notification_type.value,
                )
        except Exception as exc:
            logger.error(
                "WhatsApp notification failed | user=%s | type=%s | error=%s",
                user_id, notification_type.value, exc,
            )


def send_notification(
    db: Session,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    reference_id: Optional[UUID] = None,
    reference_type: Optional[str] = None,
) -> Notification:
    """
    Persist the in-app notification and then try optional delivery channels.
    Failures outside the DB never interrupt the donation workflow.
    """
    notif = create_notification(
        db,
        user_id,
        type,
        title,
        message,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    db.commit()
    db.refresh(notif)
    logger.info(
        "Notification stored in-app | user=%s | type=%s | title=%s",
        user_id,
        type.value,
        title,
    )
    _deliver_optional_channels(
        db,
        user_id,
        type,
        title,
        message,
        reference_id=reference_id,
        reference_type=reference_type,
    )
    return notif


# -- Domain-specific notification helpers -----------------------------------

def notify_match_found(db: Session, donation_id: UUID, donor_user_id: UUID) -> None:
    """Notify donor that a match was found for their donation."""
    try:
        send_notification(
            db,
            donor_user_id,
            NotificationType.match_found,
            "Match Found!",
            "A matching NGO has been found for your donation.",
            reference_id=donation_id,
            reference_type="donation",
        )
    except Exception as exc:
        logger.error("notify_match_found failed: %s", exc)
        db.rollback()


def notify_match_accepted(db: Session, match) -> None:
    """Notify donor that the NGO accepted the match."""
    try:
        donor_user_id = match.donation.donor.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.match_accepted,
            "Donation Accepted",
            "An NGO has accepted your donation. A pickup will be scheduled.",
            reference_id=match.id,
            reference_type="match",
        )
    except Exception as exc:
        logger.error("notify_match_accepted failed: %s", exc)
        db.rollback()


def notify_match_rejected(db: Session, match) -> None:
    """Notify donor that the NGO rejected the match."""
    try:
        donor_user_id = match.donation.donor.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.match_rejected,
            "Match Declined",
            "An NGO has declined your donation match. We will look for another match.",
            reference_id=match.id,
            reference_type="match",
        )
    except Exception as exc:
        logger.error("notify_match_rejected failed: %s", exc)
        db.rollback()


def notify_pickup_scheduled(db: Session, pickup) -> None:
    """Notify both donor and NGO that a pickup has been scheduled."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        ngo_user_id = pickup.ngo.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.pickup_scheduled,
            "Pickup Scheduled",
            f"Your donation pickup is scheduled for {pickup.scheduled_at.strftime('%Y-%m-%d %H:%M')} UTC.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        send_notification(
            db,
            ngo_user_id,
            NotificationType.pickup_scheduled,
            "Pickup Scheduled",
            f"A pickup has been scheduled for {pickup.scheduled_at.strftime('%Y-%m-%d %H:%M')} UTC.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
    except Exception as exc:
        logger.error("notify_pickup_scheduled failed: %s", exc)
        db.rollback()


def notify_pickup_completed(db: Session, pickup) -> None:
    """Notify donor and NGO that the pickup workflow has been completed."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        ngo_user_id = pickup.ngo.user_id
        demand = pickup.match.ngo_demand if pickup.match else None
        demand_label = demand.item_name if demand and demand.item_name else (
            demand.item_category.value if demand else "the demand"
        )

        send_notification(
            db,
            donor_user_id,
            NotificationType.pickup_completed,
            "Pickup Completed",
            "Your donation has been delivered and the pickup workflow is now complete. Thank you!",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        send_notification(
            db,
            ngo_user_id,
            NotificationType.demand_fulfilled,
            "Demand Fulfilled",
            f"Your demand for {demand_label} has been fulfilled.",
            reference_id=demand.id if demand else pickup.id,
            reference_type="ngo_demand" if demand else "pickup",
        )
    except Exception as exc:
        logger.error("notify_pickup_completed failed: %s", exc)
        db.rollback()


def notify_ngo_verified(db: Session, ngo_user_id: UUID, ngo_profile_id: UUID) -> None:
    """Notify NGO that their account has been verified by admin."""
    try:
        send_notification(
            db,
            ngo_user_id,
            NotificationType.ngo_verified,
            "Account Verified",
            "Your NGO account has been verified. You can now post demands and receive donations.",
            reference_id=ngo_profile_id,
            reference_type="ngo",
        )
    except Exception as exc:
        logger.error("notify_ngo_verified failed: %s", exc)
        db.rollback()


def notify_pickup_confirmed(db: Session, pickup) -> None:
    """Notify donor that the NGO confirmed the pickup date."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.pickup_scheduled,
            "Pickup Confirmed",
            f"The NGO has confirmed your pickup for {pickup.scheduled_at.strftime('%Y-%m-%d %H:%M')} UTC.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
    except Exception as exc:
        logger.error("notify_pickup_confirmed failed: %s", exc)
        db.rollback()


def notify_pickup_collected(db: Session, pickup) -> None:
    """Notify donor that items have been collected from their location."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.pickup_completed,
            "Items Collected",
            "The NGO volunteer has collected your donated items and is on the way.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
    except Exception as exc:
        logger.error("notify_pickup_collected failed: %s", exc)
        db.rollback()


def notify_pickup_delivered(db: Session, pickup) -> None:
    """Notify donor and NGO that items have been delivered to the NGO."""
    try:
        donor_user_id = pickup.donation.donor.user_id
        ngo_user_id = pickup.ngo.user_id
        send_notification(
            db,
            donor_user_id,
            NotificationType.pickup_completed,
            "Items Delivered!",
            "Your donated items have been delivered to the NGO. Thank you for your generosity!",
            reference_id=pickup.id,
            reference_type="pickup",
        )
        send_notification(
            db,
            ngo_user_id,
            NotificationType.donation_received,
            "Donation Received",
            "A donation for your organisation has been delivered and is ready for intake.",
            reference_id=pickup.id,
            reference_type="pickup",
        )
    except Exception as exc:
        logger.error("notify_pickup_delivered failed: %s", exc)
        db.rollback()
