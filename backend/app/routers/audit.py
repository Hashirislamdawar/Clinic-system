from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.deps import require_roles
from ..core.pagination import PageParams
from ..core.responses import paginated
from ..db.session import get_db
from ..schemas.audit import AuditLogOut
from ..schemas.common import PageEnvelope
from ..services.audit_service import AuditService

router = APIRouter(prefix="/api/audit", tags=["Audit"], dependencies=[Depends(require_roles("Admin"))])


@router.get(
    "",
    response_model=PageEnvelope[AuditLogOut],
    summary="View the audit trail",
    description="Paginated, newest-first log of every create/update/delete. Search with `q`.",
)
def list_audit(params: PageParams = Depends(), db: Session = Depends(get_db)):
    items, total = AuditService(db).list(params)
    return paginated(items, total, params)
