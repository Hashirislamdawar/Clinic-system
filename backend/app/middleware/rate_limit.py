"""Simple in-memory fixed-window rate limiter, keyed by client IP."""
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ..core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, tuple[float, int]] = {}

    async def dispatch(self, request, call_next):
        if not settings.rate_limit_enabled:
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        window = settings.rate_limit_window_seconds
        now = time.time()
        start, count = self._hits.get(ip, (now, 0))
        if now - start >= window:
            start, count = now, 0
        count += 1
        self._hits[ip] = (start, count)

        if count > settings.rate_limit_requests:
            retry_after = int(window - (now - start)) or 1
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "message": "Rate limit exceeded. Please slow down.",
                    "code": "RATE_LIMITED",
                },
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
