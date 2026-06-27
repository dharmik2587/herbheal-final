"""
Simple in-memory TTL cache.

Used to avoid hammering third-party APIs (IUCN, USDA) on every request.
Not distributed / not persistent — fine for a single-process Flask app.
For multi-worker production deployments, swap this for Redis.
"""
import time
import threading


class TTLCache:
    def __init__(self):
        self._store = {}
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at is not None and time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key, value, ttl_seconds=3600):
        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        with self._lock:
            self._store[key] = (value, expires_at)

    def delete(self, key):
        with self._lock:
            self._store.pop(key, None)

    def clear(self):
        with self._lock:
            self._store.clear()
