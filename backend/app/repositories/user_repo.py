from ..models import User
from .base import BaseRepository


class UserRepository(BaseRepository):
    model = User
    search_fields = ["full_name", "email", "role"]
    default_sort = "full_name"

    def get_by_email(self, email: str):
        return self.db.query(User).filter(User.email == email).first()
