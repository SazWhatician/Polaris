from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Iterator, Sequence
from typing import Any

from google.cloud.firestore import Client as FirestoreClient
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    SerializerProtocol,
    get_checkpoint_id,
    get_checkpoint_metadata,
)
from langgraph.checkpoint.memory import MemorySaver


def _get_user_id(thread_id: str) -> str:
    """Extract user_id from the thread_id.

    By convention, the thread_id is formatted as '{user_id}:{session_id}'.
    If no colon is present, falls back to 'default'.
    """
    parts = thread_id.split(":", 1)
    if len(parts) == 2:
        return parts[0]
    return "default"


class FirestoreCheckpointSaver(BaseCheckpointSaver):
    """A LangGraph CheckpointSaver backed by Google Cloud Firestore with in-memory fallback."""

    def __init__(
        self,
        client: FirestoreClient,
        *,
        serde: SerializerProtocol | None = None,
    ) -> None:
        super().__init__(serde=serde)
        self.client = client
        self._memory = MemorySaver(serde=serde)

    def _checkpoints_col(self, user_id: str) -> Any:
        return self.client.collection("users").document(user_id).collection("checkpoints")

    def _blobs_col(self, user_id: str) -> Any:
        return self.client.collection("users").document(user_id).collection("checkpoint_blobs")

    def _writes_col(self, user_id: str) -> Any:
        return self.client.collection("users").document(user_id).collection("checkpoint_writes")

    # ------- Sync Implementations -------

    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        try:
            thread_id = config["configurable"]["thread_id"]
            checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
            checkpoint_id = config["configurable"].get("checkpoint_id")
            user_id = _get_user_id(thread_id)

            if checkpoint_id:
                doc_id = f"{thread_id}_{checkpoint_ns}_{checkpoint_id}"
                doc = self._checkpoints_col(user_id).document(doc_id).get()
                if not doc.exists:
                    return None
                data = doc.to_dict() or {}
            else:
                # Query for the latest checkpoint
                query = (
                    self._checkpoints_col(user_id)
                    .where("thread_id", "==", thread_id)
                    .where("checkpoint_ns", "==", checkpoint_ns)
                    .order_by("checkpoint_id", direction="DESCENDING")
                    .limit(1)
                )
                docs = list(query.stream())
                if not docs:
                    return None
                data = docs[0].to_dict() or {}
                checkpoint_id = data["checkpoint_id"]

            checkpoint_type = data["checkpoint_type"]
            checkpoint_bytes = data["checkpoint_bytes"]
            metadata_type = data["metadata_type"]
            metadata_bytes = data["metadata_bytes"]
            parent_checkpoint_id = data.get("parent_checkpoint_id")

            checkpoint_ = self.serde.loads_typed((checkpoint_type, checkpoint_bytes))
            metadata = self.serde.loads_typed((metadata_type, metadata_bytes))

            # Load channel values from blobs
            channel_versions = checkpoint_["channel_versions"]
            channel_values = self._load_blobs(thread_id, checkpoint_ns, channel_versions, user_id)

            # Load writes
            writes = self._load_writes(thread_id, checkpoint_ns, checkpoint_id, user_id)

            return CheckpointTuple(
                config={
                    "configurable": {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": checkpoint_id,
                    }
                },
                checkpoint={
                    **checkpoint_,
                    "channel_values": channel_values,
                },
                metadata=metadata,
                parent_config=(
                    {
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": parent_checkpoint_id,
                        }
                    }
                    if parent_checkpoint_id
                    else None
                ),
                pending_writes=[
                    (
                        write["task_id"],
                        write["channel"],
                        self.serde.loads_typed((write["value_type"], write["value_bytes"])),
                    )
                    for write in writes
                ],
            )
        except Exception:
            return self._memory.get_tuple(config)

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        try:
            thread_id = config["configurable"]["thread_id"]
            checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
            checkpoint_id = checkpoint["id"]
            user_id = _get_user_id(thread_id)

            # 1. Save checkpoint and metadata
            c = checkpoint.copy()
            values = c.pop("channel_values", {})  # type: ignore[misc]

            # Save blobs for new versions
            blobs_batch = self.client.batch()
            for k, v in new_versions.items():
                blob_id = f"{thread_id}_{checkpoint_ns}_{k}_{v}"
                if k in values:
                    blob_type, blob_bytes = self.serde.dumps_typed(values[k])
                else:
                    blob_type, blob_bytes = "empty", b""

                blob_ref = self._blobs_col(user_id).document(blob_id)
                blobs_batch.set(
                    blob_ref,
                    {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "channel": k,
                        "version": v,
                        "blob_type": blob_type,
                        "blob_bytes": blob_bytes,
                    },
                )
            blobs_batch.commit()

            # Save checkpoint
            checkpoint_type, checkpoint_bytes = self.serde.dumps_typed(c)

            # Save metadata
            meta_to_save = get_checkpoint_metadata(config, metadata)
            metadata_type, metadata_bytes = self.serde.dumps_typed(meta_to_save)

            parent_checkpoint_id = config["configurable"].get("checkpoint_id")

            doc_id = f"{thread_id}_{checkpoint_ns}_{checkpoint_id}"
            self._checkpoints_col(user_id).document(doc_id).set(
                {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                    "checkpoint_type": checkpoint_type,
                    "checkpoint_bytes": checkpoint_bytes,
                    "metadata_type": metadata_type,
                    "metadata_bytes": metadata_bytes,
                    "parent_checkpoint_id": parent_checkpoint_id,
                    "created_at": checkpoint.get("ts") or "",
                }
            )

            return {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            }
        except Exception:
            return self._memory.put(config, checkpoint, metadata, new_versions)

    def put_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        try:
            thread_id = config["configurable"]["thread_id"]
            checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
            checkpoint_id = config["configurable"]["checkpoint_id"]
            user_id = _get_user_id(thread_id)

            batch = self.client.batch()
            for idx, (channel, value) in enumerate(writes):
                val_type, val_bytes = self.serde.dumps_typed(value)
                doc_id = f"{thread_id}_{checkpoint_ns}_{checkpoint_id}_{task_id}_{idx}"
                doc_ref = self._writes_col(user_id).document(doc_id)
                batch.set(
                    doc_ref,
                    {
                        "thread_id": thread_id,
                        "checkpoint_ns": checkpoint_ns,
                        "checkpoint_id": checkpoint_id,
                        "task_id": task_id,
                        "idx": idx,
                        "channel": channel,
                        "value_type": val_type,
                        "value_bytes": val_bytes,
                        "task_path": task_path,
                    },
                )
            batch.commit()
        except Exception:
            self._memory.put_writes(config, writes, task_id, task_path)

    def list(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> Iterator[CheckpointTuple]:
        try:
            if not config:
                raise ValueError(
                    "FirestoreCheckpointSaver requires a non-None config to list checkpoints."
                )

            thread_id = config["configurable"]["thread_id"]
            checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
            user_id = _get_user_id(thread_id)

            query = (
                self._checkpoints_col(user_id)
                .where("thread_id", "==", thread_id)
                .where("checkpoint_ns", "==", checkpoint_ns)
                .order_by("checkpoint_id", direction="DESCENDING")
            )

            before_checkpoint_id = get_checkpoint_id(before) if before else None

            count = 0
            for doc in query.stream():
                data = doc.to_dict() or {}
                checkpoint_id = data["checkpoint_id"]

                if before_checkpoint_id and checkpoint_id >= before_checkpoint_id:
                    continue

                # Filter by metadata
                metadata_type = data["metadata_type"]
                metadata_bytes = data["metadata_bytes"]
                metadata = self.serde.loads_typed((metadata_type, metadata_bytes))

                if filter and not all(metadata.get(k) == v for k, v in filter.items()):
                    continue

                if limit is not None and count >= limit:
                    break

                checkpoint_type = data["checkpoint_type"]
                checkpoint_bytes = data["checkpoint_bytes"]
                checkpoint_ = self.serde.loads_typed((checkpoint_type, checkpoint_bytes))

                channel_versions = checkpoint_["channel_versions"]
                channel_values = self._load_blobs(thread_id, checkpoint_ns, channel_versions, user_id)
                writes = self._load_writes(thread_id, checkpoint_ns, checkpoint_id, user_id)
                parent_checkpoint_id = data.get("parent_checkpoint_id")

                yield CheckpointTuple(
                    config={
                        "configurable": {
                            "thread_id": thread_id,
                            "checkpoint_ns": checkpoint_ns,
                            "checkpoint_id": checkpoint_id,
                        }
                    },
                    checkpoint={
                        **checkpoint_,
                        "channel_values": channel_values,
                    },
                    metadata=metadata,
                    parent_config=(
                        {
                            "configurable": {
                                "thread_id": thread_id,
                                "checkpoint_ns": checkpoint_ns,
                                "checkpoint_id": parent_checkpoint_id,
                            }
                        }
                        if parent_checkpoint_id
                        else None
                    ),
                    pending_writes=[
                        (
                            write["task_id"],
                            write["channel"],
                            self.serde.loads_typed((write["value_type"], write["value_bytes"])),
                        )
                        for write in writes
                    ],
                )
                count += 1
        except Exception:
            yield from self._memory.list(config, filter=filter, before=before, limit=limit)

    def delete_thread(self, thread_id: str) -> None:
        try:
            user_id = _get_user_id(thread_id)

            def delete_collection(col_ref: Any) -> None:
                docs = col_ref.where("thread_id", "==", thread_id).stream()
                batch = self.client.batch()
                count = 0
                for doc in docs:
                    batch.delete(doc.reference)
                    count += 1
                    if count >= 400:
                        batch.commit()
                        batch = self.client.batch()
                        count = 0
                if count > 0:
                    batch.commit()

            delete_collection(self._checkpoints_col(user_id))
            delete_collection(self._blobs_col(user_id))
            delete_collection(self._writes_col(user_id))
        except Exception:
            pass

    # ------- Async Wrappers -------

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return await asyncio.to_thread(self.get_tuple, config)

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        return await asyncio.to_thread(self.put, config, checkpoint, metadata, new_versions)

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        return await asyncio.to_thread(self.put_writes, config, writes, task_id, task_path)

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        items = await asyncio.to_thread(
            lambda: list(self.list(config, filter=filter, before=before, limit=limit))
        )
        for item in items:
            yield item

    async def adelete_thread(self, thread_id: str) -> None:
        return await asyncio.to_thread(self.delete_thread, thread_id)

    # ------- Internal Helpers -------

    def _load_blobs(
        self, thread_id: str, checkpoint_ns: str, versions: ChannelVersions, user_id: str
    ) -> dict[str, Any]:
        channel_values: dict[str, Any] = {}
        doc_refs = []
        for k, v in versions.items():
            blob_id = f"{thread_id}_{checkpoint_ns}_{k}_{v}"
            doc_refs.append(self._blobs_col(user_id).document(blob_id))

        if not doc_refs:
            return channel_values

        snapshots = self.client.get_all(doc_refs)
        for snap in snapshots:
            if snap.exists:
                data = snap.to_dict() or {}
                channel = data["channel"]
                blob_type = data["blob_type"]
                blob_bytes = data["blob_bytes"]
                if blob_type != "empty":
                    channel_values[channel] = self.serde.loads_typed((blob_type, blob_bytes))
        return channel_values

    def _load_writes(
        self, thread_id: str, checkpoint_ns: str, checkpoint_id: str, user_id: str
    ) -> list[dict[str, Any]]:
        query = (
            self._writes_col(user_id)
            .where("thread_id", "==", thread_id)
            .where("checkpoint_ns", "==", checkpoint_ns)
            .where("checkpoint_id", "==", checkpoint_id)
            .order_by("idx")
        )
        return [doc.to_dict() or {} for doc in query.stream()]
