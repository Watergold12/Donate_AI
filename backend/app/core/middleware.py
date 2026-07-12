"""
Request logging middleware.
Adds X-Request-ID header, logs method/path/status/duration on every request.
"""
import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Assigns a unique X-Request-ID to every request (or uses client-provided one)
    2. Logs: method, path, status code, and duration
    3. Attaches request_id to the response headers for client-side correlation
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start = time.perf_counter()

        # Attach to request state so services can reference it
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "rid=%s %s %s ERROR %.1fms — %s",
                request_id, request.method, request.url.path, duration_ms, exc,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "rid=%s %s %s %s %.1fms",
            request_id, request.method, request.url.path,
            response.status_code, duration_ms,
        )

        response.headers["X-Request-ID"] = request_id
        return response
