"""
Tests for the default YOLO detection workflow.
"""
from __future__ import annotations

from io import BytesIO
import sys
import types
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from PIL import Image

from app.ai.interface import BoundingBox
from app.ai.yolo_detector import YOLODetector
from app.config import settings
from app.models.enums import ItemCategory


class FakeBox:
    def __init__(self, cls_id: int, conf: float, xyxy: list[float]) -> None:
        self.cls = [cls_id]
        self.conf = [conf]
        self.xyxy = [SimpleNamespace(tolist=lambda: xyxy)]


class FakeResult:
    def __init__(self, boxes, names) -> None:
        self.boxes = boxes
        self.names = names


class FakeYOLO:
    instances = 0

    def __init__(self, yolo_model_path: str) -> None:
        type(self).instances += 1
        self.yolo_model_path = yolo_model_path

    def __call__(self, image, verbose=False):
        names = {
            0: "person",
            39: "bottle",
            41: "cup",
        }
        return [
            FakeResult(
                boxes=[
                    FakeBox(39, 0.91, [10.0, 10.0, 50.0, 50.0]),
                    FakeBox(39, 0.84, [12.0, 12.0, 52.0, 52.0]),
                    FakeBox(41, 0.35, [20.0, 20.0, 60.0, 60.0]),
                ],
                names=names,
            )
        ]


@pytest.fixture
def fake_ultralytics(monkeypatch):
    module = types.ModuleType("ultralytics")
    module.YOLO = FakeYOLO
    monkeypatch.setitem(sys.modules, "ultralytics", module)
    FakeYOLO.instances = 0
    yield module


def test_yolo_detector_loads_default_model_once(fake_ultralytics):
    detector = YOLODetector()

    assert detector.name == "YOLODetector"
    assert FakeYOLO.instances == 1


def test_yolo_detector_aggregates_and_filters_detections(monkeypatch, fake_ultralytics):
    monkeypatch.setattr("app.config.settings.detection_confidence", 0.4)
    detector = YOLODetector()

    image = Image.new("RGB", (32, 32), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    results = detector.detect(buffer.getvalue())

    assert len(results) == 1
    result = results[0]
    assert result.name == "bottle"
    assert result.category == ItemCategory.food
    assert result.count == 2
    assert result.confidence == pytest.approx((0.91 + 0.84) / 2, rel=1e-6)
    assert isinstance(result.bbox, BoundingBox)


def test_yolo_detector_raises_when_ultralytics_missing(monkeypatch):
    module = types.ModuleType("ultralytics")
    monkeypatch.setitem(sys.modules, "ultralytics", module)

    with pytest.raises(RuntimeError):
        YOLODetector()


@pytest.mark.asyncio
async def test_lifespan_uses_yolo_once_and_falls_back_when_needed(monkeypatch):
    from app import main as app_main

    load_calls = {"yolo": 0, "mock": 0, "embedding": 0}

    class FakeLoadedDetector:
        def __init__(self, yolo_model_path: str) -> None:
            load_calls["yolo"] += 1
            self.yolo_model_path = yolo_model_path

        @property
        def name(self) -> str:
            return "YOLODetector"

    class FakeMockDetector:
        def __init__(self) -> None:
            load_calls["mock"] += 1

        @property
        def name(self) -> str:
            return "MockDetector"

    class FakeEmbeddingService:
        is_ready = True
        model_name = "fake"
        load_error = None

    monkeypatch.setattr(settings, "use_mock_detector", False)
    monkeypatch.setattr("app.ai.yolo_detector.YOLODetector", FakeLoadedDetector)
    monkeypatch.setattr("app.ai.mock_detector.MockDetector", FakeMockDetector)
    monkeypatch.setattr(
        "app.services.embedding_service.initialize_embedding_service",
        lambda: load_calls.__setitem__("embedding", load_calls["embedding"] + 1) or FakeEmbeddingService(),
    )

    app = FastAPI()
    async with app_main.lifespan(app):
        assert app.state.detector.name == "YOLODetector"

    assert load_calls["yolo"] == 1
    assert load_calls["mock"] == 0
    assert load_calls["embedding"] == 1


@pytest.mark.asyncio
async def test_lifespan_falls_back_to_mock_when_yolo_fails(monkeypatch):
    from app import main as app_main

    class FailingDetector:
        def __init__(self, yolo_model_path: str) -> None:
            raise RuntimeError("boom")

    class FakeMockDetector:
        def __init__(self) -> None:
            self.name = "MockDetector"

    class FakeEmbeddingService:
        is_ready = True
        model_name = "fake"
        load_error = None

    monkeypatch.setattr(settings, "use_mock_detector", False)
    monkeypatch.setattr("app.ai.yolo_detector.YOLODetector", FailingDetector)
    monkeypatch.setattr("app.ai.mock_detector.MockDetector", FakeMockDetector)
    monkeypatch.setattr("app.services.embedding_service.initialize_embedding_service", lambda: FakeEmbeddingService())

    app = FastAPI()
    async with app_main.lifespan(app):
        assert app.state.detector.name == "MockDetector"
