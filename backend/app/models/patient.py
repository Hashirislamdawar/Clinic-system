from sqlalchemy import CheckConstraint, Column, Date, Integer, String, Text
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import SoftDeleteMixin, TimestampMixin


class Patient(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True)
    phone = Column(String(20), nullable=False)
    gender = Column(String(10), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    address = Column(Text)
    version = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {"version_id_col": version}
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female', 'Other')", name="ck_patient_gender"),
    )

    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
