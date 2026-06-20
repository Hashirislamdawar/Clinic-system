from ..models import AuditLog
from .base import BaseRepository


class AuditRepository(BaseRepository):
    model = AuditLog
    search_fields = ["entity", "action", "actor"]
    default_sort = "created_at"
    default_order = "desc"
