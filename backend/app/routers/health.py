from fastapi import APIRouter

from ..core.config import settings
from ..core.responses import ok

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health", summary="Health check")
def health():
    return ok({"status": "ok", "app": settings.app_name, "version": settings.app_version}, "Service healthy")
