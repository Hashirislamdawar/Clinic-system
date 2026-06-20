from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    entity: str
    entity_id: Optional[int] = None
    actor: str
    details: Optional[str] = None
    created_at: datetime
