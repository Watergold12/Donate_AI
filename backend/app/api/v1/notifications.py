"""
Notification API endpoints.
GET  /notifications                — list notifications (paginated)
PUT  /notifications/{id}/read      — mark single notification as read
PUT  /notifications/read-all       — mark all as read
GET  /notifications/unread-count   — get unread count
"""
import math
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services import notification_service
from app.utils.pagination import PaginationMeta, PaginationParams

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=PaginatedAPIResponse[NotificationResponse])
def list_notifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
):
    items, total = notification_service.list_notifications(db, current_user, params)
    pages = max(1, math.ceil(total / params.size)) if total > 0 else 1
    return PaginatedAPIResponse(
        data=[NotificationResponse.model_validate(n) for n in items],
        message="Notifications retrieved",
        pagination=PaginationMeta(page=params.page, size=params.size, total=total, pages=pages),
    )


@router.put("/read-all", response_model=APIResponse[dict])
def mark_all_read(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    count = notification_service.mark_all_read(db, current_user)
    return APIResponse.ok({"updated": count}, f"{count} notifications marked as read")


@router.get("/unread-count", response_model=APIResponse[UnreadCountResponse])
def unread_count(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    count = notification_service.get_unread_count(db, current_user)
    return APIResponse.ok(UnreadCountResponse(unread_count=count))


@router.put("/{notification_id}/read", response_model=APIResponse[NotificationResponse])
def mark_read(
    notification_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    notif = notification_service.mark_read(db, current_user, notification_id)
    return APIResponse.ok(NotificationResponse.model_validate(notif), "Notification marked as read")
