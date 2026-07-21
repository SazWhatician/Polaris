from __future__ import annotations

from typing import Any
import pytest
from app.repositories.checkpoint_repo import FirestoreCheckpointSaver


class FakeDocumentSnapshot:
    def __init__(self, exists: bool, data: dict[str, Any] | None = None, reference: Any = None) -> None:
        self.exists = exists
        self._data = data or {}
        self.reference = reference

    def to_dict(self) -> dict[str, Any]:
        return self._data


class FakeDocumentReference:
    def __init__(self, doc_id: str, col_ref: FakeCollectionReference) -> None:
        self.id = doc_id
        self.col_ref = col_ref
        self.reference = self

    def get(self) -> FakeDocumentSnapshot:
        db = self.col_ref.client.db
        key = (self.col_ref.path, self.id)
        if key in db:
            return FakeDocumentSnapshot(True, db[key], self)
        return FakeDocumentSnapshot(False, reference=self)

    def set(self, data: dict[str, Any]) -> None:
        db = self.col_ref.client.db
        key = (self.col_ref.path, self.id)
        db[key] = data


class FakeQuery:
    def __init__(self, docs: list[FakeDocumentSnapshot]) -> None:
        self.docs = docs

    def where(self, field: str, op: str, val: Any) -> FakeQuery:
        filtered = []
        for doc in self.docs:
            data = doc.to_dict()
            if op == "==" and data.get(field) == val:
                filtered.append(doc)
        return FakeQuery(filtered)

    def order_by(self, field: str, direction: str = "ASCENDING") -> FakeQuery:
        # Simplistic sorting, direction can be "DESCENDING"
        reverse = direction == "DESCENDING"
        sorted_docs = sorted(
            self.docs,
            key=lambda d: d.to_dict().get(field, ""),
            reverse=reverse,
        )
        return FakeQuery(sorted_docs)

    def limit(self, n: int) -> FakeQuery:
        return FakeQuery(self.docs[:n])

    def stream(self) -> list[FakeDocumentSnapshot]:
        return self.docs


class FakeCollectionReference:
    def __init__(self, path: str, client: FakeFirestoreClient) -> None:
        self.path = path
        self.client = client

    def document(self, doc_id: str) -> FakeDocumentReference:
        return FakeDocumentReference(doc_id, self)

    def where(self, field: str, op: str, val: Any) -> FakeQuery:
        # Get all docs in this collection
        docs = []
        for (col_path, doc_id), data in self.client.db.items():
            if col_path == self.path:
                doc_ref = FakeDocumentReference(doc_id, self)
                docs.append(FakeDocumentSnapshot(True, data, doc_ref))
        return FakeQuery(docs).where(field, op, val)


class FakeBatch:
    def __init__(self, client: FakeFirestoreClient) -> None:
        self.client = client
        self.ops: list[tuple[str, FakeDocumentReference, dict[str, Any] | None]] = []

    def set(self, doc_ref: FakeDocumentReference, data: dict[str, Any]) -> None:
        self.ops.append(("set", doc_ref, data))

    def delete(self, doc_ref: FakeDocumentReference) -> None:
        self.ops.append(("delete", doc_ref, None))

    def commit(self) -> None:
        for op_type, doc_ref, data in self.ops:
            key = (doc_ref.col_ref.path, doc_ref.id)
            if op_type == "set":
                assert data is not None
                self.client.db[key] = data
            elif op_type == "delete":
                self.client.db.pop(key, None)
        self.ops.clear()


class FakeFirestoreClient:
    def __init__(self) -> None:
        # Maps (collection_path, doc_id) -> data dict
        self.db: dict[tuple[str, str], dict[str, Any]] = {}

    def collection(self, name: str) -> FakeCollectionReference:
        # For subcollections, a full path is constructed when nesting.
        # But we can just return a collection mock.
        return FakeCollectionReference(name, self)

    def batch(self) -> FakeBatch:
        return FakeBatch(self)

    def get_all(self, doc_refs: list[FakeDocumentReference]) -> list[FakeDocumentSnapshot]:
        snapshots = []
        for ref in doc_refs:
            snapshots.append(ref.get())
        return snapshots


# Make a helper to mock nested collections users/{user_id}/checkpoints
# Since the repo uses self.client.collection("users").document(user_id).collection("checkpoints"),
# document(user_id) needs to support .collection(subcollection_name)
class FakeDocumentReferenceWithSubcollections(FakeDocumentReference):
    def collection(self, name: str) -> FakeCollectionReference:
        # Construct path: e.g. "users/alice/checkpoints"
        sub_path = f"users/{self.id}/{name}"
        return FakeCollectionReference(sub_path, self.col_ref.client)


class FakeCollectionReferenceWithSubcollections(FakeCollectionReference):
    def document(self, doc_id: str) -> FakeDocumentReferenceWithSubcollections:
        return FakeDocumentReferenceWithSubcollections(doc_id, self)


class FakeFirestoreClientWithSubcollections(FakeFirestoreClient):
    def collection(self, name: str) -> FakeCollectionReferenceWithSubcollections:
        return FakeCollectionReferenceWithSubcollections(name, self)


@pytest.mark.asyncio
async def test_firestore_checkpoint_saver_flow() -> None:
    client = FakeFirestoreClientWithSubcollections()
    saver = FirestoreCheckpointSaver(client=client)  # type: ignore[arg-type]

    config = {
        "configurable": {
            "thread_id": "alice:session-1",
            "checkpoint_ns": "ns-1",
        }
    }

    checkpoint = {
        "id": "chk-1",
        "ts": "2026-07-13T12:00:00Z",
        "channel_values": {
            "val1": "hello",
            "val2": "world",
        },
        "channel_versions": {
            "val1": "v1",
            "val2": "v2",
        },
    }

    metadata = {"source": "test"}

    # Test put
    new_versions = {"val1": "v1", "val2": "v2"}
    updated_config = await saver.aput(config, checkpoint, metadata, new_versions)  # type: ignore[arg-type]

    assert updated_config["configurable"]["checkpoint_id"] == "chk-1"

    # Test get_tuple with explicit checkpoint_id
    retrieved = await saver.aget_tuple(updated_config)
    assert retrieved is not None
    assert retrieved.checkpoint["id"] == "chk-1"
    assert retrieved.checkpoint["channel_values"] == {"val1": "hello", "val2": "world"}
    assert retrieved.metadata == metadata

    # Test get_tuple latest (without checkpoint_id)
    retrieved_latest = await saver.aget_tuple(
        {"configurable": {"thread_id": "alice:session-1", "checkpoint_ns": "ns-1"}}
    )
    assert retrieved_latest is not None
    assert retrieved_latest.checkpoint["id"] == "chk-1"

    # Test put_writes & load writes
    writes = [("val1", "hello-modified")]
    await saver.aput_writes(updated_config, writes, "task-1", "path-1")

    retrieved_with_writes = await saver.aget_tuple(updated_config)
    assert retrieved_with_writes is not None
    assert len(retrieved_with_writes.pending_writes) == 1
    assert retrieved_with_writes.pending_writes[0][0] == "task-1"
    assert retrieved_with_writes.pending_writes[0][1] == "val1"
    assert retrieved_with_writes.pending_writes[0][2] == "hello-modified"

    # Test alist
    results = []
    async for item in saver.alist(config):
        results.append(item)
    assert len(results) == 1
    assert results[0].checkpoint["id"] == "chk-1"

    # Test adelete_thread
    await saver.adelete_thread("alice:session-1")
    retrieved_deleted = await saver.aget_tuple(updated_config)
    assert retrieved_deleted is None
