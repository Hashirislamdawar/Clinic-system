"""Generic repository: the only layer that talks to the database directly.

Handles pagination, search, filtering, sorting and soft-delete awareness so
services and routes never write raw queries.
"""
from datetime import datetime, timezone

from sqlalchemy import asc, desc, or_


class BaseRepository:
    model = None
    search_fields: list[str] = []
    default_sort = "id"
    default_order = "asc"
    soft_delete = False  # set True on entities using SoftDeleteMixin

    def __init__(self, db):
        self.db = db

    # Subclasses override to eager-load relationships.
    def load_options(self) -> list:
        return []

    def query(self, with_deleted: bool = False):
        query = self.db.query(self.model)
        for option in self.load_options():
            query = query.options(option)
        if self.soft_delete and not with_deleted:
            query = query.filter(self.model.deleted_at.is_(None))
        return query

    def get(self, id, with_deleted: bool = False):
        return self.query(with_deleted=with_deleted).filter(self.model.id == id).first()

    def _filter(self, query, filters):
        for field, value in (filters or {}).items():
            if value is None:
                continue
            col = getattr(self.model, field, None)
            if col is not None:
                query = query.filter(col == value)
        return query

    def _search(self, query, q):
        if q and self.search_fields:
            like = f"%{q}%"
            query = query.filter(
                or_(*[getattr(self.model, f).ilike(like) for f in self.search_fields])
            )
        return query

    def default_ordering(self):
        col = getattr(self.model, self.default_sort, None) or getattr(self.model, "id")
        return [desc(col) if self.default_order == "desc" else asc(col)]

    def _order(self, query, params):
        if params.sort:
            col = getattr(self.model, params.sort, None)
            if col is not None:
                return query.order_by(desc(col) if params.order == "desc" else asc(col))
        return query.order_by(*self.default_ordering())

    def paginate(self, params, filters=None):
        query = self._search(self._filter(self.query(), filters), params.q)
        total = query.count()
        query = self._order(query, params)
        items = query.offset(params.offset).limit(params.page_size).all()
        return items, total

    def all(self):
        return self.query().order_by(*self.default_ordering()).all()

    def add(self, obj):
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def commit(self):
        self.db.commit()

    def refresh(self, obj):
        self.db.refresh(obj)

    def rollback(self):
        self.db.rollback()

    def soft_remove(self, obj):
        """Hide a row by stamping deleted_at instead of deleting it."""
        obj.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    def remove(self, obj):
        self.db.delete(obj)
        self.db.commit()
