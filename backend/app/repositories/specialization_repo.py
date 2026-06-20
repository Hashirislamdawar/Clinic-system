from ..models import Specialization
from .base import BaseRepository


class SpecializationRepository(BaseRepository):
    model = Specialization
    search_fields = ["name"]
    default_sort = "name"
