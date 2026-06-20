from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user, require_roles
from ..core.pagination import PageParams
from ..core.responses import ok, paginated
from ..db.session import get_db
from ..models import User
from ..schemas import DoctorCreate, DoctorOut, DoctorUpdate
from ..schemas.common import Envelope, ErrorResponse, PageEnvelope
from ..schemas.profile import DoctorProfileOut
from ..services.doctor_service import DoctorService

router = APIRouter(prefix="/api/doctors", tags=["Doctors"], dependencies=[Depends(get_current_user)])
WRITE = require_roles("Admin")  # only admins manage the medical staff
errors = {400: {"model": ErrorResponse}, 409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}}


@router.get("", response_model=PageEnvelope[DoctorOut], summary="List doctors",
            description="Paginated list with each doctor's specialization. Supports `q`, `sort`, `order`.")
def list_doctors(params: PageParams = Depends(), db: Session = Depends(get_db)):
    items, total = DoctorService(db).list(params)
    return paginated(items, total, params)


@router.get("/{doctor_id}", response_model=Envelope[DoctorOut], summary="Get a doctor",
            responses={404: {"model": ErrorResponse}})
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return ok(DoctorService(db).get(doctor_id))


@router.get("/{doctor_id}/profile", response_model=Envelope[DoctorProfileOut],
            summary="Doctor profile (stats + appointment history)",
            responses={404: {"model": ErrorResponse}})
def doctor_profile(doctor_id: int, db: Session = Depends(get_db)):
    return ok(DoctorService(db).profile(doctor_id))


@router.post("", response_model=Envelope[DoctorOut], status_code=status.HTTP_201_CREATED,
             summary="Create a doctor (Admin)", responses=errors)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db), user: User = Depends(WRITE)):
    return ok(DoctorService(db, actor=user.email).create(payload), "Doctor created")


@router.put("/{doctor_id}", response_model=Envelope[DoctorOut], summary="Update a doctor (Admin)",
            responses={**errors, 404: {"model": ErrorResponse}})
def update_doctor(doctor_id: int, payload: DoctorUpdate, db: Session = Depends(get_db),
                  user: User = Depends(WRITE)):
    return ok(DoctorService(db, actor=user.email).update(doctor_id, payload), "Doctor updated")


@router.delete("/{doctor_id}", response_model=Envelope[None], summary="Delete a doctor (Admin)",
               responses={404: {"model": ErrorResponse}})
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), user: User = Depends(WRITE)):
    DoctorService(db, actor=user.email).delete(doctor_id)
    return ok(None, "Doctor deleted")
