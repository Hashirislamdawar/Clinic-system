from pydantic import BaseModel

from .appointment import AppointmentOut
from .doctor import DoctorOut
from .patient import PatientOut


class PatientStats(BaseModel):
    total: int
    upcoming: int
    completed: int
    cancelled: int


class DoctorStats(BaseModel):
    total: int
    completed: int
    upcoming: int
    revenue: float


class PatientProfileOut(BaseModel):
    patient: PatientOut
    stats: PatientStats
    appointments: list[AppointmentOut]


class DoctorProfileOut(BaseModel):
    doctor: DoctorOut
    stats: DoctorStats
    appointments: list[AppointmentOut]
