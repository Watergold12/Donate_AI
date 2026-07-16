"""
AI Inference service.
Wraps the BaseDetector and returns the aggregated inference result
in the standard format:

    {
        "items": [
            {"name": "Book", "count": 4, "confidence": 0.94}
        ]
    }

This service is framework-agnostic — it receives a detector instance
and raw image bytes, returns a plain dict. The FastAPI endpoint
(detection.py) is responsible for calling this.
"""
import logging
from typing import Any

from app.ai.interface import BaseDetector

logger = logging.getLogger(__name__)


def run_inference(detector: BaseDetector, image_bytes: bytes) -> dict[str, Any]:
    """
    Run object detection and return grouped results.

    Args:
        detector: Any BaseDetector implementation (YOLODetector or MockDetector).
        image_bytes: Raw image bytes.

    Returns:
        Dict with 'items' list, each item having:
            - name: str          — human-readable object name
            - count: int         — number of instances detected
            - confidence: float  — average confidence (0.0–1.0)
            - category: str      — mapped ItemCategory value
            - bbox: dict | None  — bounding box of best detection
    """
    try:
        detections = detector.detect(image_bytes)
    except Exception as exc:
        logger.error("Inference error in run_inference: %s", exc)
        return {"items": []}

    items = []
    for d in detections:
        item: dict[str, Any] = {
            "name":       d.name,
            "count":      1,   # Already aggregated per class in YOLODetector
            "confidence": d.confidence,
            "category":   str(d.category.value) if hasattr(d.category, "value") else str(d.category),
        }
        if d.bbox is not None:
            item["bbox"] = {
                "x1": d.bbox.x1, "y1": d.bbox.y1,
                "x2": d.bbox.x2, "y2": d.bbox.y2,
            }
        items.append(item)

    return {"items": items}
