from sqlalchemy import Boolean, CheckConstraint, Column, Integer, String

from ..db.base import Base
from ..db.mixins import TimestampMixin

ROLES = ("Admin", "Doctor", "Receptionist")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="Receptionist")
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint("role IN ('Admin', 'Doctor', 'Receptionist')", name="ck_user_role"),
    )
