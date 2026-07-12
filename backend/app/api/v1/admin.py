"""
Admin API endpoints.
GET         /admin/users
GET         /admin/users/{user_id}
PATCH       /admin/users/{user_id}/status
GET         /admin/ngos/pending
PATCH       /admin/ngos/{ngo_id}/verify
GET         /admin/analytics
POST        /admin/matching/trigger
"""
import logging
import math
from datetime import datetime, timezone
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.core.exceptions import NotFoundError
from app.database import get_db
from app.models.enums import AuditAction, UserRole
from app.models.ngo import NGOProfile
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.ngo import NGOProfileResponse, NGOVerifyRequest
from app.services import analytics_service, matching_service
from app.utils.audit import log_action
from app.utils.pagination import PaginationMeta, PaginationParams, paginate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


class UserStatusUpdate(BaseModel):
    is_active: bool


def _pagination_meta(page: int, size: int, total: int) -> PaginationMeta:
    return PaginationMeta(
        page=page, size=size, total=total,
        pages=max(1, math.ceil(total / size)) if total > 0 else 1,
    )


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@router.get("/users", response_model=PaginatedAPIResponse[UserResponse])
def list_users(
    params: Annotated[PaginationParams, Depends()],
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    role: Optional[UserRole] = None,
):
    query = db.query(User).filter(User.deleted_at.is_(None))
    if role is not None:
        query = query.filter(User.role == role)
    query = query.order_by(User.created_at.desc())
    items, total = paginate(query, params)
    return PaginatedAPIResponse(
        data=[UserResponse.model_validate(u) for u in items],
        message="Users retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.get("/users/{user_id}", response_model=APIResponse[UserResponse])
def get_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise NotFoundError("User")
    return APIResponse.ok(UserResponse.model_validate(user))


@router.patch("/users/{user_id}/status", response_model=APIResponse[UserResponse])
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise NotFoundError("User")
    user.is_active = payload.is_active
    log_action(
        db, AuditAction.UPDATE, "user", user.id,
        actor_id=current_user.id,
        new_data={"is_active": payload.is_active},
        request=request,
    )
    db.commit()
    db.refresh(user)
    return APIResponse.ok(UserResponse.model_validate(user), "User status updated")


# ---------------------------------------------------------------------------
# NGO verification
# ---------------------------------------------------------------------------

@router.get("/ngos/pending", response_model=PaginatedAPIResponse[NGOProfileResponse])
def list_pending_ngos(
    params: Annotated[PaginationParams, Depends()],
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    query = (
        db.query(NGOProfile)
        .filter(NGOProfile.is_verified.is_(False))
        .order_by(NGOProfile.created_at.asc())
    )
    items, total = paginate(query, params)
    return PaginatedAPIResponse(
        data=[NGOProfileResponse.model_validate(n) for n in items],
        message="Pending NGOs retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.patch("/ngos/{ngo_id}/verify", response_model=APIResponse[NGOProfileResponse])
def verify_ngo(
    ngo_id: UUID,
    payload: NGOVerifyRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    ngo = db.query(NGOProfile).filter(NGOProfile.id == ngo_id).first()
    if not ngo:
        raise NotFoundError("NGO profile")

    if payload.approved is True:
        ngo.is_verified = True
        ngo.verified_by = current_user.id
        ngo.verified_at = datetime.now(timezone.utc)
    else:
        ngo.is_verified = False
        ngo.verified_by = None
        ngo.verified_at = None

    log_action(
        db, AuditAction.UPDATE, "ngo_profile", ngo.id,
        actor_id=current_user.id,
        new_data={"is_verified": payload.approved},
        request=request,
    )
    db.commit()
    db.refresh(ngo)

    if payload.approved is True:
        try:
            from app.services.notification_service import notify_ngo_verified
            notify_ngo_verified(db, ngo.user_id, ngo.id)
        except Exception as exc:
            logger.error("notify_ngo_verified failed: %s", exc)

    return APIResponse.ok(NGOProfileResponse.model_validate(ngo), "NGO verification updated")


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=APIResponse[dict])
def get_analytics(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    data = analytics_service.get_summary(db, current_user)
    return APIResponse.ok(data, "Analytics retrieved")


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

@router.post("/matching/trigger", response_model=APIResponse[None])
def trigger_matching(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    count = matching_service.trigger_full_match(db)
    return APIResponse.ok(None, f"{count} new match(es) created")
