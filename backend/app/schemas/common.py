"""Generic response envelopes used as response_model so /docs stays accurate."""
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class Envelope(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None


class PageEnvelope(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: List[T] = []
    meta: PageMeta


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    code: str
    errors: Optional[List[FieldError]] = None
