from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.document import DocumentStatus
from app.services.task_queue import BackgroundTaskQueue, NoopTaskQueue


@pytest.mark.asyncio
async def test_noop_task_queue() -> None:
    queue = NoopTaskQueue()
    res = await queue.enqueue("some_task", "arg1")
    assert res == "noop-job"
    await queue.aclose()


@pytest.mark.asyncio
async def test_background_task_queue_singleton() -> None:
    q1 = BackgroundTaskQueue.get_instance()
    q2 = BackgroundTaskQueue.get_instance()
    assert q1 is q2


@pytest.mark.asyncio
async def test_background_task_queue_unhandled() -> None:
    queue = BackgroundTaskQueue.get_instance()
    res = await queue.enqueue("unhandled_function")
    assert res == "noop-job"


@pytest.mark.asyncio
async def test_background_task_queue_enqueue_ocr() -> None:
    queue = BackgroundTaskQueue.get_instance()
    with patch.object(queue, "_process_document", new_callable=AsyncMock) as mock_proc:
        res = await queue.enqueue("ocr_document", "user-123", "doc-456")
        assert res == "bg-doc-456"
        await asyncio.sleep(0.05)
        mock_proc.assert_awaited_once_with("user-123", "doc-456")
    await queue.aclose()


@pytest.mark.asyncio
async def test_background_task_queue_process_document_success() -> None:
    queue = BackgroundTaskQueue.get_instance()
    mock_doc = MagicMock()
    mock_doc.status = DocumentStatus.QUEUED

    with (
        patch("app.repositories.document_repo.DocumentRepository") as mock_repo_cls,
        patch("app.services.ocr_service.OcrService") as mock_ocr_cls,
        patch("app.services.ingest_service.IngestService") as mock_ingest_cls,
    ):
        mock_repo = mock_repo_cls.return_value
        mock_repo.get = AsyncMock(return_value=mock_doc)
        mock_repo.update_status = AsyncMock()

        mock_ocr = mock_ocr_cls.return_value
        mock_ocr.process = AsyncMock()

        mock_ingest = mock_ingest_cls.return_value
        mock_ingest.process = AsyncMock()

        await queue._process_document("user-1", "doc-1")

        mock_ocr.process.assert_awaited_once_with("user-1", "doc-1")
        mock_ingest.process.assert_awaited_once_with("user-1", "doc-1")
