"""Domain exceptions + handlers that render the standard error envelope.

Services raise these; routes never build error responses themselves.
"""
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppException(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "BAD_REQUEST"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None, errors=None):
        self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.errors = errors
        super().__init__(message)


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "UNAUTHORIZED"


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    code = "FORBIDDEN"


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"


class BadRequestError(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "BAD_REQUEST"


def _envelope(message: str, code: str, errors=None) -> dict:
    body = {"success": False, "message": message, "code": code}
    if errors:
        body["errors"] = errors
    return body


def register_exception_handlers(app) -> None:
    @app.exception_handler(AppException)
    async def _app_exc(_: Request, exc: AppException):
        return JSONResponse(status_code=exc.status_code, content=_envelope(exc.message, exc.code, exc.errors))

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(_: Request, exc: RequestValidationError):
        errors = [
            {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope("Validation failed", "VALIDATION_ERROR", errors),
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope("Internal server error", "INTERNAL_ERROR"),
        )
