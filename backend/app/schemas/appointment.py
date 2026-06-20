from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    status: str = "Scheduled"
    reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        allowed = {"Scheduled", "Completed", "Cancelled", "No-Show"}
        if v not in allowed:
            raise ValueError(f"status must be one of {sorted(allowed)}")
        return v


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(AppointmentBase):
    pass


class PatientMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    phone: str


class DoctorMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr


class AppointmentOut(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = None
    patient: Optional[PatientMini] = None
    doctor: Optional[DoctorMini] = None
