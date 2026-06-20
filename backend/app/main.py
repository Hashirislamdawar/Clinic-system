"""FastAPI application factory — City Clinic API v2.

Layering: routers (HTTP) → services (business rules) → repositories (data).
Cross-cutting concerns (config, logging, exceptions, middleware) live in core/.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (imported so models register on Base.metadata)
from .core.config import settings
from .core.exceptions import register_exception_handlers
from .core.logging import setup_logging
from .db.base import Base
from .db.session import engine
from .middleware.logging_middleware import RequestLoggingMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .routers import analytics, appointments, audit, auth, doctors, health, lookups, patients

setup_logging(settings.debug)
Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "System", "description": "Health and service metadata."},
    {"name": "Auth", "description": "Login, registration and the current-user profile."},
    {"name": "Analytics", "description": "Aggregated dashboard metrics."},
    {"name": "Patients", "description": "Patient records — full CRUD with search, sort and pagination."},
    {"name": "Doctors", "description": "Doctors and their specializations."},
    {"name": "Appointments", "description": "Scheduling with double-booking protection."},
    {"name": "Lookups", "description": "Reference data (specializations) for dropdowns."},
    {"name": "Audit", "description": "Immutable audit trail of every mutation."},
]

DESCRIPTION = """
A production-grade clinic management API.

**Conventions**
- Every response uses a consistent envelope: `{ "success": true, "message": ..., "data": ... }`.
- List endpoints are paginated and return a `meta` block; they accept `page`, `page_size`, `sort`, `order` and `q`.
- Errors use `{ "success": false, "message": ..., "code": ..., "errors": [...] }`.
"""

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=DESCRIPTION,
    openapi_tags=tags_metadata,
)

# Middleware: added inner-first, so CORS (added last) is the outermost layer.
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

register_exception_handlers(app)

for module in (health, auth, analytics, patients, doctors, appointments, lookups, audit):
    app.include_router(module.router)
