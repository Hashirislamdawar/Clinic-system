from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .lookup import SpecializationOut


class DoctorBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    specialization_id: int
    consultation_fee: Decimal = Field(0, ge=0, max_digits=8, decimal_places=2)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(DoctorBase):
    pass


class DoctorOut(DoctorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = None
    specialization: Optional[SpecializationOut] = None
