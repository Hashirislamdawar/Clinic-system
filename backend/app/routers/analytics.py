from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..core.responses import ok
from ..db.session import get_db
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"], dependencies=[Depends(get_current_user)])


@router.get("/overview", summary="Dashboard analytics overview",
            description="KPIs, status distribution, appointment trend, doctor workload, "
                        "upcoming appointments and recent activity. Cached briefly.")
def overview(db: Session = Depends(get_db)):
    return ok(AnalyticsService(db).overview())
