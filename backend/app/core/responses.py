"""Helpers for building the standard success / paginated response envelopes."""
from .pagination import PageParams


def ok(data=None, message: str | None = None) -> dict:
    return {"success": True, "message": message, "data": data}


def paginated(items, total: int, params: PageParams, message: str | None = None) -> dict:
    total_pages = (total + params.page_size - 1) // params.page_size if params.page_size else 1
    return {
        "success": True,
        "message": message,
        "data": items,
        "meta": {
            "page": params.page,
            "page_size": params.page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": params.page < total_pages,
            "has_prev": params.page > 1,
        },
    }
