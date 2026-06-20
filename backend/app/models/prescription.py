from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import TimestampMixin


class Prescription(Base, TimestampMixin):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True)
    appointment_id = Column(
        Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    diagnosis = Column(Text)
    notes = Column(Text)

    appointment = relationship("Appointment", back_populates="prescription")
    items = relationship(
        "PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan"
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True)
    prescription_id = Column(
        Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False
    )
    medication_id = Column(
        Integer, ForeignKey("medications.id", ondelete="RESTRICT"), nullable=False
    )
    dosage = Column(String(60), nullable=False)
    frequency = Column(String(60), nullable=False)
    duration_days = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("prescription_id", "medication_id", name="uq_prescription_medication"),
        CheckConstraint("duration_days > 0", name="ck_duration_positive"),
    )

    prescription = relationship("Prescription", back_populates="items")
    medication = relationship("Medication", back_populates="items")
