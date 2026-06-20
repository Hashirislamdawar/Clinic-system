from ..core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from ..core.security import create_access_token, hash_password, verify_password
from ..models import User
from ..repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, db):
        self.db = db
        self.repo = UserRepository(db)

    def authenticate(self, email: str, password: str) -> User:
        user = self.repo.get_by_email(email)
        if not user or not user.is_active or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password", code="INVALID_CREDENTIALS")
        return user

    def login(self, email: str, password: str):
        user = self.authenticate(email, password)
        token = create_access_token(user.id, user.role)
        return token, user

    def register(self, data):
        if self.repo.get_by_email(data.email):
            raise ConflictError("Email already registered", code="EMAIL_TAKEN")
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
        )
        return self.repo.add(user)

    def get_user(self, user_id: int) -> User:
        user = self.repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user
