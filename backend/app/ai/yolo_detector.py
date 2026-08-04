"""
YOLOv8 real detector implementation.

Loads the default pretrained YOLO weights once at startup, runs inference per
request, and aggregates detections by class. The later trained `best.pt` model
can be swapped in through configuration without changing the workflow.
"""
import io
import logging
from typing import List

from PIL import Image

from app.ai.interface import BaseDetector, BoundingBox, DetectionResult
from app.config import settings
from app.models.enums import ItemCategory

logger = logging.getLogger(__name__)

# ── Category mapping ──────────────────────────────────────────────────────
# Maps YOLO class names (lowercase) to ItemCategory enum values.
# Extend this dict as you add more classes to your custom model.
_CATEGORY_MAP: dict[str, ItemCategory] = {
    # Clothing
    "shirt":       ItemCategory.clothing,
    "t-shirt":     ItemCategory.clothing,
    "jacket":      ItemCategory.clothing,
    "coat":        ItemCategory.clothing,
    "dress":       ItemCategory.clothing,
    "pants":       ItemCategory.clothing,
    "jeans":       ItemCategory.clothing,
    "shoes":       ItemCategory.clothing,
    "hat":         ItemCategory.clothing,
    "clothing":    ItemCategory.clothing,
    # Books / stationery
    "book":        ItemCategory.books,
    "books":       ItemCategory.books,
    "notebook":    ItemCategory.books,
    "magazine":    ItemCategory.books,
    # Electronics
    "laptop":      ItemCategory.electronics,
    "computer":    ItemCategory.electronics,
    "phone":       ItemCategory.electronics,
    "cell phone":  ItemCategory.electronics,
    "mobile":      ItemCategory.electronics,
    "tablet":      ItemCategory.electronics,
    "keyboard":    ItemCategory.electronics,
    "mouse":       ItemCategory.electronics,
    "tv":          ItemCategory.electronics,
    "television":  ItemCategory.electronics,
    "monitor":     ItemCategory.electronics,
    "electronics": ItemCategory.electronics,
    # Food / kitchen
    "bottle":      ItemCategory.food,
    "cup":         ItemCategory.food,
    "bowl":        ItemCategory.food,
    "food":        ItemCategory.food,
    "wine glass":  ItemCategory.food,
    "fork":        ItemCategory.food,
    "knife":       ItemCategory.food,
    "spoon":       ItemCategory.food,
    # Furniture
    "chair":       ItemCategory.furniture,
    "couch":       ItemCategory.furniture,
    "sofa":        ItemCategory.furniture,
    "table":       ItemCategory.furniture,
    "bed":         ItemCategory.furniture,
    "dining table": ItemCategory.furniture,
    "furniture":   ItemCategory.furniture,
    # Toys
    "teddy bear":  ItemCategory.toys,
    "toy":         ItemCategory.toys,
    "ball":        ItemCategory.toys,
    "toys":        ItemCategory.toys,
    # Medical
    "medical":     ItemCategory.medical,
}


def _map_category(class_name: str) -> ItemCategory:
    """Map a YOLO class name to an ItemCategory. Falls back to 'other'."""
    return _CATEGORY_MAP.get(class_name.lower(), ItemCategory.other)


class YOLODetector(BaseDetector):
    """
    Real YOLOv8 detector.
    Wraps the ultralytics YOLO model for inference-only use.
    """

    def __init__(self, yolo_model_path: str = "yolov8n.pt") -> None:
        self._yolo_model_path = yolo_model_path
        self._model = None
        self._load()

    def _load(self) -> None:
        """Load the YOLO model from disk. Called once at startup."""
        try:
            from ultralytics import YOLO  # type: ignore[import-untyped]
            self._model = YOLO(self._yolo_model_path)
            logger.info("YOLOv8 model loaded from '%s'", self._yolo_model_path)
        except ImportError as exc:
            logger.error("ultralytics package not installed. Run: pip install ultralytics")
            raise RuntimeError("ultralytics package not installed") from exc
        except Exception as exc:
            logger.error("Failed to load YOLOv8 model '%s': %s", self._yolo_model_path, exc)
            raise RuntimeError(f"Failed to load YOLOv8 model '{self._yolo_model_path}'") from exc

    def detect(self, image_bytes: bytes) -> List[DetectionResult]:
        """Run inference on image bytes. Returns aggregated detections."""
        if self._model is None:
            raise RuntimeError("YOLODetector model is not loaded")

        # Decode image bytes to PIL Image
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            logger.error("Failed to decode image: %s", exc)
            return []

        # Run YOLOv8 inference (no training, no gradient)
        try:
            results = self._model(image, verbose=False)
        except Exception as exc:
            logger.error("YOLOv8 inference failed: %s", exc)
            return []

        # Aggregate detections by class name
        # Key: lowercase class name -> {count, confidence_sum, best_bbox, category}
        aggregated: dict[str, dict] = {}

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                cls_id   = int(box.cls[0])
                conf     = float(box.conf[0])
                name     = result.names.get(cls_id, f"object_{cls_id}")
                key      = name.lower()

                if conf < settings.detection_confidence:
                    continue

                if key not in aggregated:
                    aggregated[key] = {
                        "display_name":   name,
                        "count":          0,
                        "confidence_sum": 0.0,
                        "best_conf":      0.0,
                        "best_bbox":      None,
                        "category":       _map_category(name),
                    }

                aggregated[key]["count"]          += 1
                aggregated[key]["confidence_sum"] += conf

                # Track bounding box of the highest-confidence instance
                if conf > aggregated[key]["best_conf"]:
                    aggregated[key]["best_conf"] = conf
                    xyxy = box.xyxy[0].tolist()
                    aggregated[key]["best_bbox"] = BoundingBox(
                        x1=xyxy[0], y1=xyxy[1],
                        x2=xyxy[2], y2=xyxy[3],
                    )

        # Build output list sorted by confidence descending
        output: List[DetectionResult] = []
        for data in aggregated.values():
            avg_conf = data["confidence_sum"] / data["count"]
            output.append(DetectionResult(
                name=data["display_name"],
                category=data["category"],
                confidence=round(avg_conf, 4),
                count=data["count"],
                bbox=data["best_bbox"],
            ))

        output.sort(key=lambda r: r.confidence, reverse=True)
        logger.info("YOLODetector detected %d unique item type(s)", len(output))
        return output

    @property
    def name(self) -> str:
        return "YOLODetector"
