"""
AI Inference service.
Wraps the BaseDetector, applies the donatable-item allowlist filter,
and returns the aggregated inference result in the standard format:

    {
        "items": [
            {"name": "Book", "count": 4, "confidence": 0.94, "category": "books"}
        ]
    }

Non-donatable objects detected by YOLO (e.g. "person", "car", "dog") are
silently removed from results before the response is sent to the client.

This service is framework-agnostic — it receives a detector instance and
raw image bytes, and returns a plain dict. The FastAPI endpoint
(detection.py) is responsible for calling this.
"""
import logging
from typing import Any

from app.ai.interface import BaseDetector
from app.ai.donatable_items import is_donatable

logger = logging.getLogger(__name__)


def run_inference(detector: BaseDetector, image_bytes: bytes) -> dict[str, Any]:
    """
    Run object detection, filter out non-donatable items, and return results.

    Args:
        detector:    Any BaseDetector implementation (YOLODetector or MockDetector).
        image_bytes: Raw image bytes.

    Returns:
        Dict with 'items' list, each entry having:
            - name:       str          — human-readable object name
            - count:      int          — number of instances detected
            - confidence: float        — average confidence (0.0–1.0)
            - category:   str          — mapped ItemCategory value
            - bbox:       dict | None  — bounding box of best detection
    """
    try:
        detections = detector.detect(image_bytes)
    except Exception as exc:
        logger.error("Inference error in run_inference: %s", exc)
        return {"items": []}

    items = []
    filtered_count = 0

    for d in detections:
        category_str = (
            str(d.category.value) if hasattr(d.category, "value") else str(d.category)
        )

        # ── Donatable allowlist check ─────────────────────────────────────────
        # Skip items that are not in the NGO donation allowlist
        # (e.g. person, car, dog detected by the pretrained COCO model).
        if not is_donatable(d.name, category_str):
            filtered_count += 1
            continue

        item: dict[str, Any] = {
            "name":       d.name,
            "count":      d.count,
            "confidence": d.confidence,
            "category":   category_str,
        }
        if d.bbox is not None:
            item["bbox"] = {
                "x1": d.bbox.x1,
                "y1": d.bbox.y1,
                "x2": d.bbox.x2,
                "y2": d.bbox.y2,
            }
        items.append(item)

    if filtered_count > 0:
        logger.info(
            "Donatable filter: kept %d item(s), removed %d non-donatable detection(s)",
            len(items),
            filtered_count,
        )

    return {"items": items}
