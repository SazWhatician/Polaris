from __future__ import annotations

import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any
import firebase_admin
from firebase_admin import firestore

from app.models.resource import CachedTopicResources


def compute_topic_hash(topic_title: str) -> str:
    """Computes a SHA256 hash of a normalized topic title for cache keying."""
    normalized = " ".join(topic_title.strip().lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


class ResourceCacheRepository:
    def __init__(self, db: firestore.firestore.Client | None = None) -> None:
        self._db = db

    @property
    def db(self) -> firestore.firestore.Client:
        if self._db is None:
            self._db = firestore.client()
        return self._db

    def _cache_col(self, user_id: str) -> Any:
        return self.db.collection("users").document(user_id).collection("resources_cache")

    async def get_cached_resources(
        self, user_id: str, topic_hash: str
    ) -> CachedTopicResources | None:
        """Retrieves cached resources for a topic if present and not expired."""
        try:
            doc_ref = self._cache_col(user_id).document(topic_hash)
            doc = doc_ref.get()
            if not doc.exists:
                return None

            data = doc.to_dict() or {}
            expires_at_str = data.get("expires_at")
            if expires_at_str:
                expires_dt = datetime.fromisoformat(expires_at_str)
                if datetime.now(timezone.utc) > expires_dt:
                    # Expired entry
                    return None

            return CachedTopicResources(**data)
        except Exception:
            return None

    async def save_cached_resources(
        self, user_id: str, topic_hash: str, topic_id: str, topic_title: str, resources: list[dict[str, Any]], ttl_days: int = 7
    ) -> CachedTopicResources:
        """Saves discovered resources to Firestore cache with a TTL (default 7 days)."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=ttl_days)

        cached_item = CachedTopicResources(
            topic_hash=topic_hash,
            topic_id=topic_id,
            topic_title=topic_title,
            resources=resources,
            cached_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
        )

        try:
            doc_ref = self._cache_col(user_id).document(topic_hash)
            doc_ref.set(cached_item.model_dump())
        except Exception as err:
            # Non-fatal if cache write fails
            pass

        return cached_item
