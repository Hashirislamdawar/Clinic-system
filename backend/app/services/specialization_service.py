from sqlalchemy.exc import IntegrityError

from ..core.exceptions import ConflictError
from ..models import Specialization
from ..repositories.specialization_repo import SpecializationRepository


class SpecializationService:
    def __init__(self, db):
        self.db = db
        self.repo = SpecializationRepository(db)

    def all(self):
        return self.repo.all()

    def create(self, data):
        spec = Specialization(**data.model_dump())
        try:
            self.repo.add(spec)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("Specialization already exists", code="DUPLICATE")
        return spec
