from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app.core.config import get_settings
from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, get_storage_bucket, is_initialized
from app.models.document import (
    DocumentCreateRequest,
    DocumentCreateResponse,
    DocumentListResponse,
    DocumentResponse,
)
from app.repositories.document_repo import DocumentRepository
from app.services.document_service import (
    DocumentNotFoundError,
    DocumentNotUploadedError,
    DocumentService,
    DocumentValidationError,
)
from app.services.storage_service import StorageService
from app.services.task_queue import TaskQueue

router = APIRouter(prefix="/api/documents", tags=["documents"])


def get_task_queue(request: Request) -> TaskQueue:
    queue = getattr(request.app.state, "task_queue", None)
    if queue is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Task queue unavailable")
    return queue


def get_document_service(
    request: Request,
    queue: Annotated[TaskQueue, Depends(get_task_queue)],
) -> DocumentService:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage backend unavailable",
        )
    settings = get_settings()
    return DocumentService(
        repo=DocumentRepository(get_firestore()),
        storage=StorageService(get_storage_bucket()),
        task_queue=queue,
        signed_url_ttl_seconds=settings.signed_url_ttl_seconds,
        max_upload_bytes=settings.max_upload_bytes,
        qdrant_repo=getattr(request.app.state, "qdrant_repo", None),
    )


DocService = Annotated[DocumentService, Depends(get_document_service)]


@router.post(
    "",
    response_model=DocumentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_upload(
    body: DocumentCreateRequest,
    user: CurrentUser,
    service: DocService,
) -> DocumentCreateResponse:
    try:
        return await service.request_upload(user.uid, body)
    except DocumentValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{document_id}/upload", response_model=DocumentResponse)
async def upload_direct(
    document_id: str,
    user: CurrentUser,
    service: DocService,
    file: UploadFile = File(...),
) -> DocumentResponse:
    content = await file.read()
    try:
        await service.upload_direct(
            user.uid,
            document_id,
            content,
            file.content_type or "application/octet-stream",
        )
        doc = await service.finalize_upload(user.uid, document_id)
        return DocumentResponse.model_validate(doc, from_attributes=True)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found") from exc


@router.post("/{document_id}/finalize", response_model=DocumentResponse)
async def finalize_upload(
    document_id: str,
    user: CurrentUser,
    service: DocService,
) -> DocumentResponse:
    try:
        doc = await service.finalize_upload(user.uid, document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found") from exc
    except DocumentNotUploadedError as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Blob not present in storage yet — upload before finalizing",
        ) from exc
    return DocumentResponse.model_validate(doc, from_attributes=True)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    user: CurrentUser,
    service: DocService,
) -> DocumentListResponse:
    settings = get_settings()
    docs = await service.list_documents(user.uid, limit=settings.document_list_limit)
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d, from_attributes=True) for d in docs],
        next_cursor=None,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    user: CurrentUser,
    service: DocService,
) -> None:
    try:
        await service.delete_document(user.uid, document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found") from exc


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess(
    document_id: str,
    user: CurrentUser,
    service: DocService,
) -> DocumentResponse:
    try:
        doc = await service.reprocess(user.uid, document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found") from exc
    except DocumentValidationError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return DocumentResponse.model_validate(doc, from_attributes=True)
