"""Reusable query parameters for list endpoints: page / page_size / sort / order / search."""
from typing import Optional

from fastapi import Query


class PageParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="1-based page number"),
        page_size: int = Query(50, ge=1, le=200, description="Items per page (max 200)"),
        sort: Optional[str] = Query(None, description="Field to sort by"),
        order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),
        q: Optional[str] = Query(None, description="Full-text search term"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort = sort
        self.order = order
        self.q = q

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
