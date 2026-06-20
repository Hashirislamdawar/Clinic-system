from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=120)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=7, max_length=20)
    gender: str
    date_of_birth: date
    address: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def gender_valid(cls, v: str) -> str:
        if v not in {"Male", "Female", "Other"}:
            raise ValueError("gender must be Male, Female, or Other")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def dob_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: Optional[int] = None
