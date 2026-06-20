from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..db.base import Base
from ..db.mixins import TimestampMixin


class Specialization(Base, TimestampMixin):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)

    doctors = relationship("Doctor", back_populates="specialization")
