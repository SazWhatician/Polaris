from __future__ import annotations

import asyncio
from dataclasses import dataclass
import os
from pathlib import Path
from typing import Any

from app.core.logging import get_logger
from app.core.supabase import get_supabase_client

log = get_logger(__name__)


@dataclass(frozen=True)
class UploadAuthorization:
    upload_url: str
    storage_path: str
    expires_in_seconds: int
    required_headers: dict[str, str]


class StorageService:
    def __init__(self, bucket_name: str = "polaris-documents") -> None:
        self._bucket_name = bucket_name
        self._storage_dir = Path(os.environ.get("STORAGE_DIR", "/app/storage"))
        self._storage_dir.mkdir(parents=True, exist_ok=True)

    def _local_path(self, storage_path: str) -> Path:
        return self._storage_dir / storage_path

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

    def _get_sb_bucket(self) -> Any:
        sb = get_supabase_client()
        if sb is not None:
            try:
                return sb.storage.from_(self._bucket_name)
            except Exception:
                pass
        return None

    def _sign_upload_url(self, storage_path: str, mime_type: str, ttl_seconds: int) -> str:
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                res = bucket.create_signed_upload_url(storage_path)
                if isinstance(res, dict) and res.get("signed_url"):
                    return res["signed_url"]
                if hasattr(res, "signed_url") and res.signed_url:
                    return res.signed_url
            except Exception as exc:
                log.warning("supabase.signed_upload_url_fallback", error=str(exc))
        return f"/api/documents/direct"

    def _exists_sync(self, storage_path: str) -> bool:
        local_file = self._local_path(storage_path)
        if local_file.is_file() and local_file.stat().st_size > 0:
            return True
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                parent_dir = str(Path(storage_path).parent).replace("\\", "/")
                filename = Path(storage_path).name
                items = bucket.list(parent_dir if parent_dir != "." else "")
                return any(item.get("name") == filename for item in items if isinstance(item, dict))
            except Exception:
                pass
        return False

    def _size_sync(self, storage_path: str) -> int | None:
        local_file = self._local_path(storage_path)
        if local_file.is_file():
            return local_file.stat().st_size
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                parent_dir = str(Path(storage_path).parent).replace("\\", "/")
                filename = Path(storage_path).name
                items = bucket.list(parent_dir if parent_dir != "." else "")
                for item in items:
                    if isinstance(item, dict) and item.get("name") == filename:
                        metadata = item.get("metadata")
                        if isinstance(metadata, dict) and "size" in metadata:
                            return int(metadata["size"])
            except Exception as exc:
                log.warning("supabase.storage_size_failed", error=str(exc))
        return None

    def _download_sync(self, storage_path: str) -> bytes:
        local_file = self._local_path(storage_path)
        if local_file.is_file():
            return local_file.read_bytes()
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                data = bucket.download(storage_path)
                if isinstance(data, bytes):
                    return data
            except Exception as exc:
                log.warning("supabase.storage_download_failed", error=str(exc))
        raise FileNotFoundError(f"Blob not found in local disk or Supabase Storage: {storage_path}")

    def _delete_sync(self, storage_path: str) -> None:
        local_file = self._local_path(storage_path)
        if local_file.is_file():
            try:
                local_file.unlink(missing_ok=True)
            except Exception:
                pass
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                bucket.remove([storage_path])
            except Exception:
                pass

    def _upload_sync(self, storage_path: str, data: bytes, mime_type: str) -> None:
        # 1. Local disk persistence
        local_file = self._local_path(storage_path)
        local_file.parent.mkdir(parents=True, exist_ok=True)
        local_file.write_bytes(data)

        # 2. Supabase Storage upload if connected
        bucket = self._get_sb_bucket()
        if bucket is not None:
            try:
                bucket.upload(
                    storage_path,
                    data,
                    file_options={"content-type": mime_type, "upsert": "true"},
                )
            except Exception as exc:
                log.warning("supabase.storage_upload_skipped", error=str(exc), path=storage_path)


