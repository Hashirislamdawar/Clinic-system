from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user, require_roles
from ..core.pagination import PageParams
from ..core.responses import ok, paginated
from ..db.session import get_db
from ..models import User
from ..schemas import PatientCreate, PatientOut, PatientUpdate
from ..schemas.common import Envelope, ErrorResponse, PageEnvelope
from ..schemas.profile import PatientProfileOut
from ..services.patient_service import PatientService

router = APIRouter(prefix="/api/patients", tags=["Patients"], dependencies=[Depends(get_current_user)])
WRITE = require_roles("Admin", "Receptionist")
errors = {409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}}


@router.get(
    "",
    response_model=PageEnvelope[PatientOut],
    summary="List patients",
    description="Paginated list. Use `q` to search name/email/phone, `sort`/`order` to sort.",
)
def list_patients(params: PageParams = Depends(), db: Session = Depends(get_db)):
    items, total = PatientService(db).list(params)
    return paginated(items, total, params)


@router.get("/{patient_id}", response_model=Envelope[PatientOut], summary="Get a patient",
            responses={404: {"model": ErrorResponse}})
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return ok(PatientService(db).get(patient_id))


@router.get("/{patient_id}/profile", response_model=Envelope[PatientProfileOut],
            summary="Patient profile (stats + appointment history)",
            responses={404: {"model": ErrorResponse}})
def patient_profile(patient_id: int, db: Session = Depends(get_db)):
    return ok(PatientService(db).profile(patient_id))


@router.post("", response_model=Envelope[PatientOut], status_code=status.HTTP_201_CREATED,
             summary="Create a patient (Admin / Receptionist)", responses=errors)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db), user: User = Depends(WRITE)):
    return ok(PatientService(db, actor=user.email).create(payload), "Patient created")


@router.put("/{patient_id}", response_model=Envelope[PatientOut], summary="Update a patient (Admin / Receptionist)",
            responses={**errors, 404: {"model": ErrorResponse}})
def update_patient(patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db),
                   user: User = Depends(WRITE)):
    return ok(PatientService(db, actor=user.email).update(patient_id, payload), "Patient updated")


@router.delete("/{patient_id}", response_model=Envelope[None], summary="Delete a patient (Admin / Receptionist)",
               responses={404: {"model": ErrorResponse}})
def delete_patient(patient_id: int, db: Session = Depends(get_db), user: User = Depends(WRITE)):
    PatientService(db, actor=user.email).delete(patient_id)
    return ok(None, "Patient deleted")
