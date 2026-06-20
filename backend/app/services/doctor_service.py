from datetime import date

from sqlalchemy.exc import IntegrityError

from ..core.exceptions import BadRequestError, ConflictError, NotFoundError
from ..models import Doctor
from ..repositories.appointment_repo import AppointmentRepository
from ..repositories.doctor_repo import DoctorRepository
from ..repositories.specialization_repo import SpecializationRepository
from .audit_service import AuditService

EMAIL_CONFLICT = "A doctor with this email already exists"


class DoctorService:
    def __init__(self, db, actor="system"):
        self.db = db
        self.actor = actor
        self.repo = DoctorRepository(db)
        self.specs = SpecializationRepository(db)
        self.audit = AuditService(db)

    def _require_specialization(self, specialization_id):
        if not self.specs.get(specialization_id):
            raise BadRequestError("specialization_id does not exist", code="INVALID_SPECIALIZATION")

    def list(self, params):
        return self.repo.paginate(params)

    def get(self, doctor_id):
        doctor = self.repo.get(doctor_id)
        if not doctor:
            raise NotFoundError("Doctor not found")
        return doctor

    def profile(self, doctor_id):
        doctor = self.get(doctor_id)
        appts = AppointmentRepository(self.db).by_doctor(doctor_id)
        today = date.today()
        completed = sum(1 for a in appts if a.status == "Completed")
        stats = {
            "total": len(appts),
            "completed": completed,
            "upcoming": sum(1 for a in appts if a.status == "Scheduled" and a.appointment_date >= today),
            "revenue": float(doctor.consultation_fee) * completed,
        }
        return {"doctor": doctor, "stats": stats, "appointments": appts}

    def create(self, data):
        self._require_specialization(data.specialization_id)
        doctor = Doctor(**data.model_dump())
        try:
            self.repo.add(doctor)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(EMAIL_CONFLICT, code="EMAIL_TAKEN")
        self.audit.record("create", "doctor", doctor.id, actor=self.actor)
        return doctor

    def update(self, doctor_id, data):
        doctor = self.get(doctor_id)
        self._require_specialization(data.specialization_id)
        for field, value in data.model_dump().items():
            setattr(doctor, field, value)
        try:
            self.repo.commit()
            self.repo.refresh(doctor)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError(EMAIL_CONFLICT, code="EMAIL_TAKEN")
        self.audit.record("update", "doctor", doctor.id, actor=self.actor)
        return doctor

    def delete(self, doctor_id):
        doctor = self.get(doctor_id)
        self.repo.soft_remove(doctor)  # soft delete keeps historical appointments intact
        self.audit.record("delete", "doctor", doctor_id, actor=self.actor)
