"""
FastAPI application entry point.
Configures CORS, middleware, lifespan events, and registers all API routers.
"""
import logging
import os
import warnings
from contextlib import asynccontextmanager

# Suppress bcrypt version detection warning (cosmetic only — bcrypt works fine)
warnings.filterwarnings("ignore", message=".*error reading bcrypt version.*")
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings

# Configure logging before anything else
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Code before yield runs on startup.
    Code after yield runs on shutdown.
    """
    # ── Startup ──────────────────────────────────────────────
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)

    # Ensure media directory exists
    os.makedirs(settings.media_path, exist_ok=True)
    logger.info("Media directory ready: %s", settings.media_path)

    # Initialize AI detector and attach to app state.
    # Default flow: try pretrained YOLO first, then fall back to the mock detector.
    if settings.use_mock_detector:
        from app.ai.mock_detector import MockDetector
        app.state.detector = MockDetector()
        logger.info("AI detector: MockDetector (use_mock_detector=true)")
    else:
        try:
            from app.ai.yolo_detector import YOLODetector
            app.state.detector = YOLODetector(yolo_model_path=settings.yolo_model_path)
            logger.info("AI detector: YOLODetector loaded from %s", settings.yolo_model_path)
        except Exception as exc:
            logger.warning(
                "YOLODetector failed to load (%s). Falling back to MockDetector.",
                exc,
            )
            from app.ai.mock_detector import MockDetector
            app.state.detector = MockDetector()
            logger.info("AI detector: MockDetector fallback activated")

    # Initialize semantic embedding service and attach to app state
    from app.services.embedding_service import initialize_embedding_service

    app.state.embedding_service = initialize_embedding_service()
    if app.state.embedding_service.is_ready:
        logger.info("Semantic embedding service ready: %s", app.state.embedding_service.model_name)
    else:
        logger.warning(
            "Semantic embedding service unavailable; using fallback semantic scoring (%s)",
            app.state.embedding_service.load_error or "unknown error",
        )

    logger.info("Application startup complete")
    yield

    # ── Shutdown ─────────────────────────────────────────────
    logger.info("Application shutting down")


def create_application() -> FastAPI:
    """
    Application factory.
    Creates and configures the FastAPI instance.
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-Based Donation Management System API",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request Logging Middleware ────────────────────────────
    from app.core.middleware import RequestLoggingMiddleware
    app.add_middleware(RequestLoggingMiddleware)

    # ── Static Files (media uploads) ─────────────────────────
    os.makedirs(settings.media_path, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.media_path), name="media")

    # ── Exception Handlers ────────────────────────────────────
    from app.core.exceptions import register_exception_handlers
    register_exception_handlers(app)

    # ── API Routers ───────────────────────────────────────────
    # Imported lazily to avoid circular imports during startup
    from app.api.v1.router import api_router
    app.include_router(api_router, prefix="/api/v1")

    # ── Health Check ─────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "version": settings.app_version,
                "environment": settings.environment,
            },
            "message": "Service is running",
        }

    return app


# The application instance used by uvicorn
app = create_application()
