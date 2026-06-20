"""Reusable model mixins for timestamps and soft deletion."""
from sqlalchemy import Column, DateTime, func


class TimestampMixin:
    """Adds created_at / updated_at, maintained automatically by the database."""

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SoftDeleteMixin:
    """Adds deleted_at. Rows are hidden rather than physically removed."""

    deleted_at = Column(DateTime, nullable=True, index=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
