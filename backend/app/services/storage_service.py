"""Firebase Storage: signed URL generation + blob ops.

We never proxy file bytes through the API. The flow is:
  client -> POST /api/documents -> get signed PUT URL
  client -> PUT file directly to GCS
  client -> POST /api/documents/{id}/finalize -> we verify the blob exists
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import timedelta

from google.cloud.storage import Bucket


@dataclass(frozen=True)
class UploadAuthorization:
    upload_url: str
    storage_path: str
    expires_in_seconds: int
    required_headers: dict[str, str]


class StorageService:
    def __init__(self, bucket: Bucket) -> None:
        self._bucket = bucket

    async def authorize_upload(
        self,
        *,
        storage_path: str,
        mime_type: str,
        ttl_seconds: int,
    ) -> UploadAuthorization:
        url = await asyncio.to_thread(self._sign_upload_url, storage_path, mime_type, ttl_seconds)
        return UploadAuthorization(
            upload_url=url,
            storage_path=storage_path,
            expires_in_seconds=ttl_seconds,
            required_headers={"Content-Type": mime_type},
        )

    async def blob_exists(self, storage_path: str) -> bool:
        return await asyncio.to_thread(self._exists_sync, storage_path)

    async def get_blob_size(self, storage_path: str) -> int | None:
        return await asyncio.to_thread(self._size_sync, storage_path)

    async def download_bytes(self, storage_path: str) -> bytes:
        return await asyncio.to_thread(self._download_sync, storage_path)

    async def delete_blob(self, storage_path: str) -> None:
        await asyncio.to_thread(self._delete_sync, storage_path)

    async def upload_bytes(self, storage_path: str, data: bytes, mime_type: str) -> None:
        await asyncio.to_thread(self._upload_sync, storage_path, data, mime_type)

    # ------- sync internals -------

    def _sign_upload_url(self, storage_path: str, mime_type: str, ttl_seconds: int) -> str:
        blob = self._bucket.blob(storage_path)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=ttl_seconds),
            method="PUT",
            content_type=mime_type,
        )

    def _exists_sync(self, storage_path: str) -> bool:
        return self._bucket.blob(storage_path).exists()

    def _size_sync(self, storage_path: str) -> int | None:
        blob = self._bucket.blob(storage_path)
        blob.reload()  # populate size from server
        return blob.size

    def _download_sync(self, storage_path: str) -> bytes:
        return self._bucket.blob(storage_path).download_as_bytes()

    def _delete_sync(self, storage_path: str) -> None:
        blob = self._bucket.blob(storage_path)
        if blob.exists():
            blob.delete()

    def _upload_sync(self, storage_path: str, data: bytes, mime_type: str) -> None:
        blob = self._bucket.blob(storage_path)
        blob.upload_from_string(data, content_type=mime_type)
