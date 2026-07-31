"""
Tests for the notification service and multi-channel delivery hooks.
"""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.config import settings
from app.models.enums import ItemCategory, NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.services import notification_service as ns


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class TestNotificationService:
    def test_send_notification_persists_in_app_record(self, db, donor_token):
        user = db.query(User).filter(User.email == "donor@test.com").first()
        assert user is not None

        ns.send_notification(
            db,
            user.id,
            NotificationType.system,
            "System Notice",
            "This is a test notification.",
            reference_type="system",
        )

        notif = db.query(Notification).filter(Notification.user_id == user.id).first()
        assert notif is not None
        assert notif.title == "System Notice"
        assert notif.message == "This is a test notification."
        assert notif.type == NotificationType.system
        assert notif.is_read is False

    def test_optional_channels_attempt_delivery_when_enabled(self, client, db, ngo_token, monkeypatch):
        client.put(
            "/api/v1/ngos/profile",
            json={"contact_phone": "+919876543210"},
            headers=auth(ngo_token),
        )
        user = db.query(User).filter(User.email == "ngo@test.com").first()
        assert user is not None

        calls: list[tuple] = []

        monkeypatch.setattr(settings, "notification_email_enabled", True)
        monkeypatch.setattr(settings, "notification_sms_enabled", True)
        monkeypatch.setattr(settings, "notification_whatsapp_enabled", True)

        def fake_email(email: str, title: str, message: str) -> bool:
            calls.append(("email", email, title, message))
            return True

        def fake_webhook(url, channel, recipient, title, message, notification_type, reference_id, reference_type) -> bool:
            calls.append((channel.value, recipient.phone, title, message, notification_type.value))
            return True

        monkeypatch.setattr(ns, "_send_email_notification", fake_email)
        monkeypatch.setattr(ns, "_send_webhook_notification", fake_webhook)

        ns.send_notification(
            db,
            user.id,
            NotificationType.system,
            "Channel Test",
            "Deliver this through all enabled channels.",
            reference_id=uuid4(),
            reference_type="system",
        )

        channel_names = [call[0] for call in calls]
        assert "email" in channel_names
        assert "sms" in channel_names
        assert "whatsapp" in channel_names

    def test_pickup_completed_notifies_donor_and_ngo(self, db, donor_token, ngo_token, monkeypatch):
        donor = db.query(User).filter(User.email == "donor@test.com").first()
        ngo = db.query(User).filter(User.email == "ngo@test.com").first()
        assert donor is not None
        assert ngo is not None

        calls: list[tuple] = []

        def fake_send_notification(db_session, user_id, notif_type, title, message, reference_id=None, reference_type=None):
            calls.append((user_id, notif_type, title, message, reference_type))
            return None

        monkeypatch.setattr(ns, "send_notification", fake_send_notification)

        demand = SimpleNamespace(
            item_name="Winter Coats",
            item_category=ItemCategory.clothing,
        )
        pickup = SimpleNamespace(
            id=uuid4(),
            scheduled_at=datetime.now(timezone.utc),
            donation=SimpleNamespace(donor=SimpleNamespace(user_id=donor.id)),
            ngo=SimpleNamespace(user_id=ngo.id),
            match=SimpleNamespace(ngo_demand=demand),
        )

        ns.notify_pickup_completed(db, pickup)

        assert len(calls) == 2
        assert calls[0][0] == donor.id
        assert calls[0][1] == NotificationType.pickup_completed
        assert calls[1][0] == ngo.id
        assert calls[1][1] == NotificationType.demand_fulfilled
