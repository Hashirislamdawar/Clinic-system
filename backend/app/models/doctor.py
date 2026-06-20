from sqlalchemy import Column, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import SoftDeleteMixin, TimestampMixin


class Doctor(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False, unique=True)
    phone = Column(String(20))
    specialization_id = Column(
        Integer, ForeignKey("specializations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    consultation_fee = Column(Numeric(8, 2), nullable=False, default=0)
    version = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {"version_id_col": version}

    specialization = relationship("Specialization", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
