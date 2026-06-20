"""ORM models package. Importing this registers every model on Base.metadata."""
from ..db.base import Base
from .appointment import Appointment
from .audit import AuditLog
from .doctor import Doctor
from .medication import Medication
from .patient import Patient
from .prescription import Prescription, PrescriptionItem
from .specialization import Specialization
from .user import User

__all__ = [
    "Base",
    "Specialization",
    "Medication",
    "Doctor",
    "Patient",
    "Appointment",
    "Prescription",
    "PrescriptionItem",
    "AuditLog",
    "User",
]
