"""
NGO API endpoints.
GET/PUT  /ngos/profile
POST/GET /ngos/demands
PUT/DELETE /ngos/demands/{id}
GET      /ngos/matches
PUT      /ngos/matches/{id}/accept
PUT      /ngos/matches/{id}/reject
GET      /ngos/analytics
"""
import math
import os
import uuid
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import require_ngo
from app.database import get_db
from app.models.enums import MatchStatus
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedAPIResponse
from app.schemas.matching import MatchActionRequest, MatchResponse
from app.schemas.ngo import NGOProfileResponse, NGOProfileUpdate
from app.schemas.ngo_demand import NGODemandCreate, NGODemandResponse, NGODemandUpdate
from app.schemas.analytics import NGOSummary
from app.services import ngo_service, matching_service
from app.utils.pagination import PaginationMeta, PaginationParams

router = APIRouter(prefix="/ngos", tags=["NGOs"])


def _pagination_meta(page: int, size: int, total: int) -> PaginationMeta:
    return PaginationMeta(
        page=page, size=size, total=total,
        pages=max(1, math.ceil(total / size)) if total > 0 else 1,
    )


@router.get("/profile", response_model=APIResponse[NGOProfileResponse])
def get_profile(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = ngo_service.get_profile(db, current_user)
    return APIResponse.ok(NGOProfileResponse.model_validate(profile))


@router.put("/profile", response_model=APIResponse[NGOProfileResponse])
def update_profile(
    payload: NGOProfileUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = ngo_service.update_profile(db, current_user, payload, request)
    return APIResponse.ok(NGOProfileResponse.model_validate(profile), "Profile updated")


@router.post("/verification-documents", response_model=APIResponse[NGOProfileResponse])
async def upload_verification_documents(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_ngo),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"File format {ext} not allowed. Supported formats: PDF, PNG, JPG, DOC")

    docs_dir = os.path.join(settings.media_path, "verification_docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(docs_dir, unique_filename)
    
    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=400, detail=f"File size exceeds maximum allowed size of {settings.max_upload_size_mb}MB")
        
    with open(file_path, "wb") as f:
        f.write(content)
        
    rel_path = f"/media/verification_docs/{unique_filename}"
    profile = ngo_service.submit_verification_documents(db, current_user, rel_path, request)
    return APIResponse.ok(NGOProfileResponse.model_validate(profile), "Verification documents submitted successfully")


@router.post("/demands", response_model=APIResponse[NGODemandResponse], status_code=status.HTTP_201_CREATED)
def create_demand(
    payload: NGODemandCreate,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    demand = ngo_service.create_demand(db, current_user, payload, request)
    return APIResponse.ok(NGODemandResponse.model_validate(demand), "Demand created")


@router.get("/demands", response_model=PaginatedAPIResponse[NGODemandResponse])
def list_demands(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
    active_only: bool = True,
):
    items, total = ngo_service.list_demands(db, current_user, params, active_only)
    return PaginatedAPIResponse(
        data=[NGODemandResponse.model_validate(d) for d in items],
        message="Demands retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.put("/demands/{demand_id}", response_model=APIResponse[NGODemandResponse])
def update_demand(
    demand_id: UUID,
    payload: NGODemandUpdate,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    demand = ngo_service.update_demand(db, current_user, demand_id, payload, request)
    return APIResponse.ok(NGODemandResponse.model_validate(demand), "Demand updated")


@router.delete("/demands/{demand_id}", response_model=APIResponse[None])
def delete_demand(
    demand_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    ngo_service.delete_demand(db, current_user, demand_id, request)
    return APIResponse.ok(None, "Demand deactivated")


@router.get("/matches", response_model=PaginatedAPIResponse[MatchResponse])
def list_matches(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
    params: Annotated[PaginationParams, Depends()],
    status_filter: Optional[MatchStatus] = None,
):
    items, total = ngo_service.list_matches(db, current_user, params, status_filter)
    return PaginatedAPIResponse(
        data=[MatchResponse.model_validate(m) for m in items],
        message="Matches retrieved",
        pagination=_pagination_meta(params.page, params.size, total),
    )


@router.put("/matches/{match_id}/accept", response_model=APIResponse[MatchResponse])
def accept_match(
    match_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    match = ngo_service.accept_match(db, current_user, match_id, request)
    return APIResponse.ok(MatchResponse.model_validate(match), "Match accepted")


@router.put("/matches/{match_id}/reject", response_model=APIResponse[MatchResponse])
def reject_match(
    match_id: UUID,
    payload: MatchActionRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    match = ngo_service.reject_match(db, current_user, match_id, payload.rejection_reason, request)
    return APIResponse.ok(MatchResponse.model_validate(match), "Match rejected")


@router.get("/analytics", response_model=APIResponse[NGOSummary])
def get_analytics(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    data = ngo_service.get_ngo_analytics(db, current_user)
    return APIResponse.ok(NGOSummary(**data))


@router.post("/matches/trigger", response_model=APIResponse[None])
def trigger_matching(
    current_user: Annotated[User, Depends(require_ngo)],
    db: Annotated[Session, Depends(get_db)],
):
    count = matching_service.trigger_full_match(db)
    return APIResponse.ok(None, f"{count} new match(es) created")

