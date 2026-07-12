"""Notification schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.enums import NotificationType


class NotificationResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    created_at: datetime


class UnreadCountResponse(BaseModel):
    unread_count: int
