"""Persists an audit trail to the database (and mirrors it to the log)."""
from ..core.cache import cache
from ..core.logging import audit as audit_console
from ..models import AuditLog
from ..repositories.audit_repo import AuditRepository


class AuditService:
    def __init__(self, db):
        self.db = db
        self.repo = AuditRepository(db)

    def record(self, action, entity, entity_id, actor="system", details=None):
        audit_console(action, entity, entity_id, actor=actor)
        row = AuditLog(
            action=action, entity=entity, entity_id=entity_id, actor=actor, details=details
        )
        self.repo.add(row)
        # Any mutation makes cached aggregates stale.
        cache.invalidate("analytics")
        return row

    def list(self, params):
        return self.repo.paginate(params)
