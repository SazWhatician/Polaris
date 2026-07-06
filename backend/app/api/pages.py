from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, is_initialized
from app.models.document import PageListResponse
from app.repositories.document_repo import DocumentRepository
from app.repositories.page_repo import PageRepository

router = APIRouter(prefix="/api/documents", tags=["pages"])


def get_page_repo() -> PageRepository:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Storage backend unavailable"
        )
    return PageRepository(get_firestore())


def get_doc_repo() -> DocumentRepository:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Storage backend unavailable"
        )
    return DocumentRepository(get_firestore())


PageRepo = Annotated[PageRepository, Depends(get_page_repo)]
DocRepo = Annotated[DocumentRepository, Depends(get_doc_repo)]


@router.get("/{document_id}/pages", response_model=PageListResponse)
async def list_pages(
    document_id: str,
    user: CurrentUser,
    page_repo: PageRepo,
    doc_repo: DocRepo,
) -> PageListResponse:
    # Ownership check: 404 if doc doesn't exist OR belongs to another user.
    owner_doc = await doc_repo.get(user.uid, document_id)
    if owner_doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found")

    pages = await page_repo.list_pages(user.uid, document_id)
    return PageListResponse(items=pages)
