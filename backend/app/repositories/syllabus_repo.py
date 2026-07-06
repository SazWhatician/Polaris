from __future__ import annotations

import asyncio
from typing import Any

from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1 import DocumentSnapshot

from app.models.syllabus import Syllabus, SyllabusCoverage, Topic


class SyllabusRepository:
    def __init__(self, client: FirestoreClient) -> None:
        self._client = client

    # ------- Syllabus CRUD -------

    async def create(self, syllabus: Syllabus) -> Syllabus:
        await asyncio.to_thread(self._create_sync, syllabus)
        return syllabus

    async def get(self, user_id: str, syllabus_id: str) -> Syllabus | None:
        snap = await asyncio.to_thread(self._get_sync, user_id, syllabus_id)
        return _syllabus_from_snapshot(snap) if snap and snap.exists else None

    async def list(self, user_id: str, limit: int = 50) -> list[Syllabus]:
        snaps = await asyncio.to_thread(self._list_sync, user_id, limit)
        return [_syllabus_from_snapshot(s) for s in snaps]

    async def delete(self, user_id: str, syllabus_id: str) -> None:
        await asyncio.to_thread(self._delete_sync, user_id, syllabus_id)

    # ------- Coverage CRUD -------

    async def save_coverage(self, user_id: str, coverage: SyllabusCoverage) -> SyllabusCoverage:
        await asyncio.to_thread(self._save_coverage_sync, user_id, coverage)
        return coverage

    async def get_coverage(self, user_id: str, syllabus_id: str) -> SyllabusCoverage | None:
        snap = await asyncio.to_thread(self._get_coverage_sync, user_id, syllabus_id)
        return _coverage_from_snapshot(snap) if snap and snap.exists else None

    async def delete_coverage(self, user_id: str, syllabus_id: str) -> None:
        await asyncio.to_thread(self._delete_coverage_sync, user_id, syllabus_id)

    # ------- Sync Internals -------

    def _syllabi_col(self, user_id: str) -> Any:
        return self._client.collection("users").document(user_id).collection("syllabi")

    def _coverage_col(self, user_id: str) -> Any:
        return self._client.collection("users").document(user_id).collection("syllabus_coverages")

    def _create_sync(self, syllabus: Syllabus) -> None:
        self._syllabi_col(syllabus.user_id).document(syllabus.id).set(_syllabus_to_dict(syllabus))

    def _get_sync(self, user_id: str, syllabus_id: str) -> DocumentSnapshot:
        return self._syllabi_col(user_id).document(syllabus_id).get()

    def _list_sync(self, user_id: str, limit: int) -> list[DocumentSnapshot]:
        from google.cloud.firestore_v1 import Query

        query = (
            self._syllabi_col(user_id)
            .order_by("created_at", direction=Query.DESCENDING)
            .limit(limit)
        )
        return list(query.stream())

    def _delete_sync(self, user_id: str, syllabus_id: str) -> None:
        self._syllabi_col(user_id).document(syllabus_id).delete()

    def _save_coverage_sync(self, user_id: str, coverage: SyllabusCoverage) -> None:
        self._coverage_col(user_id).document(coverage.syllabus_id).set(_coverage_to_dict(coverage))

    def _get_coverage_sync(self, user_id: str, syllabus_id: str) -> DocumentSnapshot:
        return self._coverage_col(user_id).document(syllabus_id).get()

    def _delete_coverage_sync(self, user_id: str, syllabus_id: str) -> None:
        self._coverage_col(user_id).document(syllabus_id).delete()


# ------- Helper Functions -------


def _syllabus_to_dict(syllabus: Syllabus) -> dict[str, Any]:
    return {
        "id": syllabus.id,
        "user_id": syllabus.user_id,
        "name": syllabus.name,
        "created_at": syllabus.created_at,
        "updated_at": syllabus.updated_at,
        "tree": [t.model_dump() for t in syllabus.tree],
    }


def _syllabus_from_snapshot(snap: DocumentSnapshot) -> Syllabus:
    data = snap.to_dict() or {}
    return Syllabus(
        id=data["id"],
        user_id=data["user_id"],
        name=data["name"],
        created_at=data["created_at"],
        updated_at=data["updated_at"],
        tree=[Topic.model_validate(t) for t in data.get("tree", [])],
    )


def _coverage_to_dict(coverage: SyllabusCoverage) -> dict[str, Any]:
    return {
        "syllabus_id": coverage.syllabus_id,
        "overall_score": coverage.overall_score,
        "topics": {tid: c.model_dump() for tid, c in coverage.topics.items()},
        "updated_at": coverage.updated_at,
    }


def _coverage_from_snapshot(snap: DocumentSnapshot) -> SyllabusCoverage:
    data = snap.to_dict() or {}
    from app.models.syllabus import TopicCoverage

    return SyllabusCoverage(
        syllabus_id=data["syllabus_id"],
        overall_score=float(data["overall_score"]),
        topics={tid: TopicCoverage.model_validate(c) for tid, c in data.get("topics", {}).items()},
        updated_at=data["updated_at"],
    )
