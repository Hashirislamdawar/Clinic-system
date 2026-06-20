from sqlalchemy import Column, DateTime, Integer, String, Text, func

from ..db.base import Base


class AuditLog(Base):
    """Immutable record of every create / update / delete performed."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    action = Column(String(20), nullable=False)  # create / update / delete
    entity = Column(String(40), nullable=False, index=True)  # e.g. patient
    entity_id = Column(Integer, index=True)
    actor = Column(String(60), nullable=False, default="system")
    details = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
