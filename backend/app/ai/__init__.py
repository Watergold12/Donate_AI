"""
AI detection module.

Exports:
  - BaseDetector, DetectionResult, BoundingBox  — core detector interface
  - YOLODetector                                 — production detector
  - MockDetector                                 — fallback/dev detector
  - is_donatable                                 — CSV-backed allowlist filter
"""
from app.ai.donatable_items import is_donatable

__all__ = ["is_donatable"]
