"""
Mock AI detector for development and testing.
Returns deterministic sample results without loading any model.
Used when USE_MOCK_DETECTOR=true in settings (the default).
"""
import logging
from typing import List
from app.ai.interface import BaseDetector, BoundingBox, DetectionResult
from app.models.enums import ItemCategory

logger = logging.getLogger(__name__)

# Realistic sample detections covering multiple categories
MOCK_DETECTIONS: List[DetectionResult] = [
    DetectionResult(
        name="shirt",
        category=ItemCategory.clothing,
        confidence=0.91,
        count=1,
        bbox=BoundingBox(x1=50.0, y1=30.0, x2=250.0, y2=280.0),
    ),
    DetectionResult(
        name="jacket",
        category=ItemCategory.clothing,
        confidence=0.85,
        count=1,
        bbox=BoundingBox(x1=270.0, y1=20.0, x2=480.0, y2=310.0),
    ),
    DetectionResult(
        name="book",
        category=ItemCategory.books,
        confidence=0.78,
        count=1,
        bbox=BoundingBox(x1=100.0, y1=320.0, x2=220.0, y2=420.0),
    ),
    DetectionResult(
        name="laptop",
        category=ItemCategory.electronics,
        confidence=0.88,
        count=1,
        bbox=BoundingBox(x1=300.0, y1=350.0, x2=500.0, y2=480.0),
    ),
    DetectionResult(
        name="stuffed toy",
        category=ItemCategory.toys,
        confidence=0.72,
        count=1,
        bbox=BoundingBox(x1=30.0, y1=440.0, x2=180.0, y2=560.0),
    ),
]


class MockDetector(BaseDetector):
    """
    Mock implementation of BaseDetector.
    Returns a fixed list of sample detections regardless of input image.
    Safe to use in development and CI/CD — no GPU, no model file required.
    """

    def detect(self, image_bytes: bytes) -> List[DetectionResult]:
        logger.debug(
            "MockDetector.detect() called with %d bytes — returning %d mock results",
            len(image_bytes),
            len(MOCK_DETECTIONS),
        )
        return MOCK_DETECTIONS

    @property
    def name(self) -> str:
        return "MockDetector"
