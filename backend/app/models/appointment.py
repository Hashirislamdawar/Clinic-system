from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import SoftDeleteMixin, TimestampMixin


class Appointment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doctor_id = Column(
        Integer, ForeignKey("doctors.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default="Scheduled", index=True)
    reason = Column(Text)
    version = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {"version_id_col": version}
    __table_args__ = (
        UniqueConstraint("doctor_id", "appointment_date", "start_time", name="uq_doctor_slot"),
        CheckConstraint(
            "status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')",
            name="ck_appointment_status",
        ),
    )

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    prescription = relationship(
        "Prescription", back_populates="appointment", uselist=False, cascade="all, delete-orphan"
    )
