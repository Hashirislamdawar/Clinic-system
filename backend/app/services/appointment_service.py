from sqlalchemy.exc import IntegrityError

from ..core.exceptions import BadRequestError, ConflictError, NotFoundError
from ..models import Appointment
from ..repositories.appointment_repo import AppointmentRepository
from ..repositories.doctor_repo import DoctorRepository
from ..repositories.patient_repo import PatientRepository
from .audit_service import AuditService

SLOT_CONFLICT = "That doctor is already booked for this date and time"


class AppointmentService:
    def __init__(self, db, actor="system"):
        self.db = db
        self.actor = actor
        self.repo = AppointmentRepository(db)
        self.patients = PatientRepository(db)
        self.doctors = DoctorRepository(db)
        self.audit = AuditService(db)

    def _require_refs(self, patient_id, doctor_id):
        if not self.patients.get(patient_id):
            raise BadRequestError("patient_id does not exist", code="INVALID_PATIENT")
        if not self.doctors.get(doctor_id):
            raise BadRequestError("doctor_id does not exist", code="INVALID_DOCTOR")

    def list(self, params, status=None):
        return self.repo.paginate(params, filters={"status": status})

    def get(self, appointment_id):
        appt = self.repo.get(appointment_id)
        if not appt:
            raise NotFoundError("Appointment not found")
        return appt

    def create(self, data):
        self._require_refs(data.patient_id, data.doctor_id)
        appt = Appointment(**data.model_dump())
        try:
            self.repo.add(appt)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(SLOT_CONFLICT, code="SLOT_TAKEN")
        self.audit.record("create", "appointment", appt.id, actor=self.actor)
        return self.get(appt.id)

    def update(self, appointment_id, data):
        appt = self.get(appointment_id)
        self._require_refs(data.patient_id, data.doctor_id)
        for field, value in data.model_dump().items():
            setattr(appt, field, value)
        try:
            self.repo.commit()
            self.repo.refresh(appt)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(SLOT_CONFLICT, code="SLOT_TAKEN")
        self.audit.record("update", "appointment", appt.id, actor=self.actor)
        return appt

    def delete(self, appointment_id):
        appt = self.get(appointment_id)
        self.repo.soft_remove(appt)  # soft delete
        self.audit.record("delete", "appointment", appointment_id, actor=self.actor)
