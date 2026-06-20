from datetime import date

from sqlalchemy.exc import IntegrityError

from ..core.exceptions import ConflictError, NotFoundError
from ..models import Patient
from ..repositories.appointment_repo import AppointmentRepository
from ..repositories.patient_repo import PatientRepository
from .audit_service import AuditService

EMAIL_CONFLICT = "A patient with this email already exists"


class PatientService:
    def __init__(self, db, actor="system"):
        self.db = db
        self.actor = actor
        self.repo = PatientRepository(db)
        self.audit = AuditService(db)

    def list(self, params):
        return self.repo.paginate(params)

    def get(self, patient_id):
        patient = self.repo.get(patient_id)
        if not patient:
            raise NotFoundError("Patient not found")
        return patient

    def profile(self, patient_id):
        patient = self.get(patient_id)
        appts = AppointmentRepository(self.db).by_patient(patient_id)
        today = date.today()
        stats = {
            "total": len(appts),
            "upcoming": sum(1 for a in appts if a.status == "Scheduled" and a.appointment_date >= today),
            "completed": sum(1 for a in appts if a.status == "Completed"),
            "cancelled": sum(1 for a in appts if a.status in ("Cancelled", "No-Show")),
        }
        return {"patient": patient, "stats": stats, "appointments": appts}

    def create(self, data):
        patient = Patient(**data.model_dump())
        try:
            self.repo.add(patient)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(EMAIL_CONFLICT, code="EMAIL_TAKEN")
        self.audit.record("create", "patient", patient.id, actor=self.actor)
        return patient

    def update(self, patient_id, data):
        patient = self.get(patient_id)
        for field, value in data.model_dump().items():
            setattr(patient, field, value)
        try:
            self.repo.commit()
            self.repo.refresh(patient)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(EMAIL_CONFLICT, code="EMAIL_TAKEN")
        self.audit.record("update", "patient", patient.id, actor=self.actor)
        return patient

    def delete(self, patient_id):
        patient = self.get(patient_id)
        self.repo.soft_remove(patient)  # soft delete
        self.audit.record("delete", "patient", patient_id, actor=self.actor)
