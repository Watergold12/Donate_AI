"""
Pickup API endpoints.
POST     /pickups
GET      /pickups/donor
GET      /pickups/ngo
GET      /pickups/{pickup_id}
PUT      /pickups/{pickup_id}
PUT      /pickups/{pickup_id}/status
"""
import math
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_active_user,
    require_donor,
    require_ngo,
    require_ngo_or_admin,
)
from app.database import get_db
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.pickup import PickupCreate, PickupResponse, PickupStatusUpdate, PickupUpdate
from app.services import pickup_service
from app.utils.pagination import PaginationMeta, PaginationParams

router = APIRouter(prefix="/pickups", tags=["Pickups"])


def _pagination_meta(page: int, size: int, total: int) -> PaginationMeta:
    return PaginationMeta(
        page=page, size=size, total=total,
        pages=max(1, math.ceil(total / size)) if total > 0 else 1,
    )


@router.post("", response_model=APIResponse[PickupResponse], status_code=status.HTTP_201_CREATED)
def create_pickup(
    payload: PickupCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    pickup = pickup_service.create_pickup(db, current_user, payload, request)
    return APIResponse.ok(PickupResponse.model_validate(pickup), "Pickup scheduled")


@router.get("/donor", response_model=PaginatedAPIResponse[PickupResponse])
def list_donor_pickups(
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
):
    items, total = pickup_service.list_donor_pickups(db, current_user, params)
    return PaginatedAPIResponse(
        data=[PickupResponse.model_validate(p) for p in items],
        message="Pickups retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.get("/ngo", response_model=PaginatedAPIResponse[PickupResponse])
def list_ngo_pickups(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
):
    items, total = pickup_service.list_ngo_pickups(db, current_user, params)
    return PaginatedAPIResponse(
        data=[PickupResponse.model_validate(p) for p in items],
        message="Pickups retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.get("/{pickup_id}", response_model=APIResponse[PickupResponse])
def get_pickup(
    pickup_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    pickup = pickup_service.get_pickup(db, pickup_id)
    return APIResponse.ok(PickupResponse.model_validate(pickup))


@router.put("/{pickup_id}", response_model=APIResponse[PickupResponse])
def update_pickup(
    pickup_id: UUID,
    payload: PickupUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    pickup = pickup_service.update_pickup(db, current_user, pickup_id, payload, request)
    return APIResponse.ok(PickupResponse.model_validate(pickup), "Pickup updated")


@router.put("/{pickup_id}/status", response_model=APIResponse[PickupResponse])
def update_pickup_status(
    pickup_id: UUID,
    payload: PickupStatusUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo_or_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    pickup = pickup_service.update_status(db, current_user, pickup_id, payload, request)
    return APIResponse.ok(PickupResponse.model_validate(pickup), "Pickup status updated")
