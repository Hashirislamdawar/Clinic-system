from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user, require_roles
from ..core.pagination import PageParams
from ..core.responses import ok, paginated
from ..db.session import get_db
from ..models import User
from ..schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate
from ..schemas.common import Envelope, ErrorResponse, PageEnvelope
from ..services.appointment_service import AppointmentService

router = APIRouter(prefix="/api/appointments", tags=["Appointments"], dependencies=[Depends(get_current_user)])
WRITE = require_roles("Admin", "Receptionist", "Doctor")
DELETE = require_roles("Admin", "Receptionist")
errors = {400: {"model": ErrorResponse}, 409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}}


@router.get("", response_model=PageEnvelope[AppointmentOut], summary="List appointments",
            description="Paginated list joined with patient & doctor. Filter with `status`, search `reason` with `q`.")
def list_appointments(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
):
    items, total = AppointmentService(db).list(params, status=status_filter)
    return paginated(items, total, params)


@router.get("/{appointment_id}", response_model=Envelope[AppointmentOut], summary="Get an appointment",
            responses={404: {"model": ErrorResponse}})
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return ok(AppointmentService(db).get(appointment_id))


@router.post("", response_model=Envelope[AppointmentOut], status_code=status.HTTP_201_CREATED,
             summary="Book an appointment (Admin / Receptionist / Doctor)", responses=errors)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db), user: User = Depends(WRITE)):
    return ok(AppointmentService(db, actor=user.email).create(payload), "Appointment booked")


@router.put("/{appointment_id}", response_model=Envelope[AppointmentOut],
            summary="Update an appointment (Admin / Receptionist / Doctor)",
            responses={**errors, 404: {"model": ErrorResponse}})
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db),
                       user: User = Depends(WRITE)):
    return ok(AppointmentService(db, actor=user.email).update(appointment_id, payload), "Appointment updated")


@router.delete("/{appointment_id}", response_model=Envelope[None], summary="Delete an appointment (Admin / Receptionist)",
               responses={404: {"model": ErrorResponse}})
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), user: User = Depends(DELETE)):
    AppointmentService(db, actor=user.email).delete(appointment_id)
    return ok(None, "Appointment deleted")
