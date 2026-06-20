from ..models import Patient
from .base import BaseRepository


class PatientRepository(BaseRepository):
    model = Patient
    search_fields = ["full_name", "email", "phone"]
    default_sort = "full_name"
    soft_delete = True
