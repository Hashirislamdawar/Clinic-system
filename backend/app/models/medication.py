from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import TimestampMixin


class Medication(Base, TimestampMixin):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True)
    form = Column(String(50))  # e.g. Tablet, Syrup, Capsule

    items = relationship("PrescriptionItem", back_populates="medication")
