"""AI detection request/response schemas."""
from typing import List, Optional
from pydantic import BaseModel
from app.models.enums import ItemCategory


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResult(BaseModel):
    name: str
    category: ItemCategory
    confidence: float
    bbox: Optional[BoundingBox] = None


class DetectionResponse(BaseModel):
    items: List[DetectionResult]
    total_detected: int
    image_path: Optional[str] = None
