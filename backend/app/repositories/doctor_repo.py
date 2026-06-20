from sqlalchemy.orm import joinedload

from ..models import Doctor
from .base import BaseRepository


class DoctorRepository(BaseRepository):
    model = Doctor
    search_fields = ["full_name", "email", "phone"]
    default_sort = "full_name"
    soft_delete = True

    def load_options(self):
        return [joinedload(Doctor.specialization)]
