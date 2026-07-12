"""
AI Detection API endpoint.
POST /detection/analyze — upload image, get detected items back.
The detector implementation (Mock or YOLOv8) is loaded at startup
and attached to app.state.detector. This endpoint never knows which
implementation is active — clean dependency inversion.
"""
import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Request, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.detection import BoundingBox, DetectionResponse, DetectionResult

router = APIRouter(prefix="/detection", tags=["AI Detection"])


@router.post("/analyze", response_model=APIResponse[DetectionResponse])
async def analyze_image(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    image: UploadFile = File(..., description="Image file to analyze (JPEG or PNG)"),
):
    """
    Upload an image and receive a list of detected donation items.
    Uses the AI detector registered at app startup (MockDetector or YOLOv8).
    """
    # Validate content type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG and WebP images are supported",
        )

    # Validate size
    image_bytes = await image.read()
    if len(image_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum size of {settings.max_upload_size_mb}MB",
        )

    # Save image to media directory
    os.makedirs(settings.media_path, exist_ok=True)
    filename = f"{uuid.uuid4()}{os.path.splitext(image.filename or '.jpg')[1]}"
    image_path = os.path.join(settings.media_path, filename)
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    # Run detection via the injected detector (app.state.detector)
    detector = getattr(request.app.state, "detector", None)
    if not detector:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI detector not initialized",
        )

    raw_results = detector.detect(image_bytes)

    # Map dataclass results to Pydantic response schemas
    items = [
        DetectionResult(
            name=r.name,
            category=r.category,
            confidence=r.confidence,
            bbox=BoundingBox(x1=r.bbox.x1, y1=r.bbox.y1, x2=r.bbox.x2, y2=r.bbox.y2) if r.bbox else None,
        )
        for r in raw_results
    ]

    return APIResponse.ok(
        DetectionResponse(items=items, total_detected=len(items), image_path=f"/media/{filename}"),
        f"Detected {len(items)} item(s)",
    )
