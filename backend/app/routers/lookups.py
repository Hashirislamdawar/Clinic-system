from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user, require_roles
from ..core.responses import ok
from ..db.session import get_db
from ..schemas import SpecializationCreate, SpecializationOut
from ..schemas.common import Envelope, ErrorResponse
from ..services.specialization_service import SpecializationService

router = APIRouter(prefix="/api", tags=["Lookups"], dependencies=[Depends(get_current_user)])


@router.get("/specializations", response_model=Envelope[List[SpecializationOut]],
            summary="List specializations")
def list_specializations(db: Session = Depends(get_db)):
    return ok(SpecializationService(db).all())


@router.post("/specializations", response_model=Envelope[SpecializationOut],
             status_code=status.HTTP_201_CREATED, summary="Create a specialization (Admin)",
             dependencies=[Depends(require_roles("Admin"))],
             responses={403: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def create_specialization(payload: SpecializationCreate, db: Session = Depends(get_db)):
    return ok(SpecializationService(db).create(payload), "Specialization created")
