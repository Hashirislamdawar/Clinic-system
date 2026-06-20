"""Shared FastAPI dependencies for authentication and role-based access."""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models import User
from ..repositories.user_repo import UserRepository
from .exceptions import ForbiddenError, UnauthorizedError
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated", code="NOT_AUTHENTICATED")
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise UnauthorizedError("Invalid or expired token", code="INVALID_TOKEN")

    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("Account not found or inactive", code="INVALID_USER")
    return user


def require_roles(*roles: str):
    """Dependency factory enforcing that the current user has one of `roles`."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError("You do not have permission to perform this action")
        return user

    return checker
