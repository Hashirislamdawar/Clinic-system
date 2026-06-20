"""Pydantic schema package."""
from .appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate
from .common import Envelope, ErrorResponse, PageEnvelope, PageMeta
from .doctor import DoctorCreate, DoctorOut, DoctorUpdate
from .lookup import SpecializationCreate, SpecializationOut
from .patient import PatientCreate, PatientOut, PatientUpdate

__all__ = [
    "Envelope",
    "PageEnvelope",
    "PageMeta",
    "ErrorResponse",
    "PatientCreate",
    "PatientUpdate",
    "PatientOut",
    "DoctorCreate",
    "DoctorUpdate",
    "DoctorOut",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentOut",
    "SpecializationCreate",
    "SpecializationOut",
]
