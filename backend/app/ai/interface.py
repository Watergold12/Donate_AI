"""
Abstract AI detector interface.
Concrete implementations (YOLOv8, mock) implement this interface.
The detection endpoint depends on BaseDetector — never on a concrete class.
Swapping from mock to YOLOv8 requires only changing which class is 
instantiated in main.py lifespan, not any API code.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
from app.models.enums import ItemCategory


@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float


@dataclass
class DetectionResult:
    """A single object detected in an image."""
    name: str                          # human-readable label, e.g. "shirt"
    category: ItemCategory             # mapped to system ItemCategory enum
    confidence: float                  # 0.0–1.0 YOLO confidence score
    count: int = 1                     # estimated quantity for the grouped object
    bbox: Optional[BoundingBox] = None # bounding box coordinates (optional)


class BaseDetector(ABC):
    """
    Abstract base class for all AI detectors.
    
    Any concrete detector must implement `detect(image_bytes)`.
    The detection endpoint in the API layer only depends on this interface.
    """

    @abstractmethod
    def detect(self, image_bytes: bytes) -> List[DetectionResult]:
        """
        Run inference on raw image bytes.
        
        Args:
            image_bytes: Raw image file bytes (JPEG, PNG, etc.)
            
        Returns:
            List of DetectionResult objects, one per detected item.
            Empty list if nothing is detected above the confidence threshold.
            
        Raises:
            RuntimeError: If inference fails in an unrecoverable way.
        """
        ...

    @property
    def name(self) -> str:
        """Return detector implementation name for logging."""
        return self.__class__.__name__
