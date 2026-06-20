"""A tiny in-process TTL cache used to avoid recomputing hot aggregates."""
import time


class TTLCache:
    def __init__(self):
        self._store: dict[str, tuple[float, object]] = {}

    def get(self, key: str):
        entry = self._store.get(key)
        if not entry:
            return None
        expires, value = entry
        if time.time() > expires:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value, ttl: int) -> None:
        self._store[key] = (time.time() + ttl, value)

    def invalidate(self, prefix: str = "") -> None:
        for key in [k for k in self._store if k.startswith(prefix)]:
            self._store.pop(key, None)


cache = TTLCache()
