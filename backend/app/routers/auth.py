from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user, require_roles
from ..core.responses import ok
from ..db.session import get_db
from ..models import User
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut
from ..schemas.common import Envelope, ErrorResponse
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=Envelope[TokenResponse], summary="Log in",
             responses={401: {"model": ErrorResponse}})
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token, user = AuthService(db).login(payload.email, payload.password)
    return ok(TokenResponse(access_token=token, user=user), "Welcome back")


@router.post("/register", response_model=Envelope[UserOut], status_code=status.HTTP_201_CREATED,
             summary="Create a user (Admin only)",
             dependencies=[Depends(require_roles("Admin"))],
             responses={403: {"model": ErrorResponse}, 409: {"model": ErrorResponse}})
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return ok(AuthService(db).register(payload), "User created")


@router.get("/me", response_model=Envelope[UserOut], summary="Current user profile")
def me(user: User = Depends(get_current_user)):
    return ok(user)
