"""
Donations API endpoints.
POST   /donations                     — create donation
PUT    /donations/{id}                — update donation notes
DELETE /donations/{id}                — cancel donation
POST   /donations/{id}/submit         — submit for matching
GET    /donations/{id}/items          — list items
POST   /donations/{id}/items          — add item
PUT    /donations/{id}/items/{iid}    — update item
DELETE /donations/{id}/items/{iid}    — remove item
GET    /donations/{id}/match          — get matches
"""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_donor
from app.database import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.donation import (
    DonationCreate, DonationResponse, DonationUpdate,
    DonationItemCreate, DonationItemResponse, DonationItemUpdate,
)
from app.schemas.matching import MatchResponse
from app.services import donation_service

router = APIRouter(prefix="/donations", tags=["Donations"])


@router.post("", response_model=APIResponse[DonationResponse], status_code=status.HTTP_201_CREATED)
def create_donation(
    payload: DonationCreate,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    donation = donation_service.create_donation(db, current_user, payload, request)
    return APIResponse.ok(DonationResponse.model_validate(donation), "Donation created")


@router.put("/{donation_id}", response_model=APIResponse[DonationResponse])
def update_donation(
    donation_id: UUID,
    payload: DonationUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    donation = donation_service.update_donation(db, current_user, donation_id, payload, request)
    return APIResponse.ok(DonationResponse.model_validate(donation), "Donation updated")


@router.delete("/{donation_id}", response_model=APIResponse[None])
def cancel_donation(
    donation_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    donation_service.cancel_donation(db, current_user, donation_id, request)
    return APIResponse.ok(None, "Donation cancelled")


@router.post("/{donation_id}/submit", response_model=APIResponse[DonationResponse])
def submit_donation(
    donation_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    donation = donation_service.submit_donation(db, current_user, donation_id, request)
    return APIResponse.ok(DonationResponse.model_validate(donation), "Donation submitted for matching")


@router.get("/{donation_id}/items", response_model=APIResponse[list[DonationItemResponse]])
def list_items(
    donation_id: UUID,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    from app.models.donation import DonationItem
    donation = donation_service.get_donation(db, current_user, donation_id)
    items = db.query(DonationItem).filter(
        DonationItem.donation_id == donation_id,
        DonationItem.is_confirmed.is_(True),
    ).all()
    return APIResponse.ok([DonationItemResponse.model_validate(i) for i in items])


@router.post("/{donation_id}/items", response_model=APIResponse[DonationItemResponse], status_code=status.HTTP_201_CREATED)
def add_item(
    donation_id: UUID,
    payload: DonationItemCreate,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    item = donation_service.add_item(db, current_user, donation_id, payload, request)
    return APIResponse.ok(DonationItemResponse.model_validate(item), "Item added")


@router.put("/{donation_id}/items/{item_id}", response_model=APIResponse[DonationItemResponse])
def update_item(
    donation_id: UUID,
    item_id: UUID,
    payload: DonationItemUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    item = donation_service.update_item(db, current_user, donation_id, item_id, payload, request)
    return APIResponse.ok(DonationItemResponse.model_validate(item), "Item updated")


@router.delete("/{donation_id}/items/{item_id}", response_model=APIResponse[None])
def remove_item(
    donation_id: UUID,
    item_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    donation_service.remove_item(db, current_user, donation_id, item_id, request)
    return APIResponse.ok(None, "Item removed")


@router.get("/{donation_id}/match", response_model=APIResponse[list[MatchResponse]])
def get_matches(
    donation_id: UUID,
    current_user: Annotated[User, Depends(require_donor)],
    db: Annotated[Session, Depends(get_db)],
):
    matches = donation_service.get_donation_matches(db, current_user, donation_id)
    return APIResponse.ok([MatchResponse.model_validate(m) for m in matches])
