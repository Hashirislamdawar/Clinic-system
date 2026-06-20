"""Backwards-compatible shim. The canonical definitions now live in app.db.*

Existing imports such as `from .database import Base, SessionLocal, engine, get_db`
continue to work (e.g. app/seed.py).
"""
from .db.base import Base
from .db.session import DATABASE_URL, SessionLocal, engine, get_db

__all__ = ["Base", "DATABASE_URL", "SessionLocal", "engine", "get_db"]
