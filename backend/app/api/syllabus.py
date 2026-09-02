from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, is_initialized
from app.models.syllabus import (
    SyllabusCoverage,
    SyllabusCreateRequest,
    SyllabusListResponse,
    SyllabusResponse,
)
from app.repositories.document_repo import DocumentRepository
from app.repositories.page_repo import PageRepository
from app.repositories.syllabus_repo import SyllabusRepository
from app.services.syllabus_service import (
    SyllabusNotFoundError,
    SyllabusService,
    SyllabusValidationError,
)

router = APIRouter(prefix="/api/syllabus", tags=["syllabus"])


def get_syllabus_service(request: Request) -> SyllabusService:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )

    rag_service = getattr(request.app.state, "rag_service", None)
    if not rag_service:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="RAG system unavailable")

    return SyllabusService(
        syllabus_repo=SyllabusRepository(get_firestore()),
        doc_repo=DocumentRepository(get_firestore()),
        page_repo=PageRepository(get_firestore()),
        qdrant_repo=rag_service._qdrant_repo,
        embedder=rag_service._embedder,
        groq=rag_service._groq,
    )


SyllabusServiceDep = Annotated[SyllabusService, Depends(get_syllabus_service)]


@router.post("", response_model=SyllabusResponse, status_code=status.HTTP_201_CREATED)
async def create_syllabus(
    body: SyllabusCreateRequest,
    user: CurrentUser,
    service: SyllabusServiceDep,
) -> SyllabusResponse:
    try:
        syllabus = await service.create_syllabus(
            user_id=user.uid,
            name=body.name,
            syllabus_text=body.syllabus_text,
            document_id=body.document_id,
        )
        return SyllabusResponse.model_validate(syllabus, from_attributes=True)
    except SyllabusValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/upload", response_model=SyllabusResponse, status_code=status.HTTP_201_CREATED)
async def upload_syllabus(
    user: CurrentUser,
    service: SyllabusServiceDep,
    name: str = Form(...),
    file: UploadFile = File(...),
) -> SyllabusResponse:
    """Uploads a syllabus file (PDF, TXT, MD) and extracts structured module blocks."""
    contents = await file.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    extracted_text = ""
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif")
    is_image = filename.endswith(IMAGE_EXTENSIONS) or content_type.startswith("image/")

    if is_image:
        from app.services.image_transcriber import transcribe_image_bytes

        mime = content_type if content_type.startswith("image/") else "image/jpeg"
        extracted_text = await transcribe_image_bytes(contents, mime_type=mime)
    elif filename.endswith(".pdf"):
        from app.services.page_extractor import extract_pdf_page_texts

        page_texts = extract_pdf_page_texts(contents)
        extracted_text = "\n\n".join(t for t in page_texts if t).strip()

        # Scanned PDF fallback: If extracted digital text is empty, transcribe rendered pages
        if len(extracted_text) < 40:
            from app.services.image_transcriber import transcribe_scanned_pdf_bytes

            extracted_text = await transcribe_scanned_pdf_bytes(contents)
    else:
        extracted_text = contents.decode("utf-8", errors="replace").strip()

    if not extracted_text or len(extracted_text.strip()) < 10:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not extract readable text from the uploaded photo or document. "
                "Please make sure the syllabus image is clear and legible, or paste the syllabus text directly."
            ),
        )

    try:
        syllabus = await service.create_syllabus(
            user_id=user.uid,
            name=name.strip() or (file.filename or "Uploaded Syllabus"),
            syllabus_text=extracted_text,
        )
        return SyllabusResponse.model_validate(syllabus, from_attributes=True)
    except SyllabusValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=SyllabusListResponse)
async def list_syllabi(
    user: CurrentUser,
    service: SyllabusServiceDep,
) -> SyllabusListResponse:
    items = await service.list_syllabi(user.uid)
    return SyllabusListResponse(
        items=[SyllabusResponse.model_validate(item, from_attributes=True) for item in items]
    )


@router.get("/{syllabus_id}", response_model=SyllabusResponse)
async def get_syllabus(
    syllabus_id: str,
    user: CurrentUser,
    service: SyllabusServiceDep,
) -> SyllabusResponse:
    syllabus = await service.get_syllabus(user.uid, syllabus_id)
    if not syllabus:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    return SyllabusResponse.model_validate(syllabus, from_attributes=True)


@router.delete("/{syllabus_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_syllabus(
    syllabus_id: str,
    user: CurrentUser,
    service: SyllabusServiceDep,
) -> None:
    syllabus = await service.get_syllabus(user.uid, syllabus_id)
    if not syllabus:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Syllabus not found")
    await service.delete_syllabus(user.uid, syllabus_id)


@router.post("/{syllabus_id}/coverage", response_model=SyllabusCoverage)
async def compute_coverage(
    syllabus_id: str,
    user: CurrentUser,
    service: SyllabusServiceDep,
    document_ids: list[str] | None = None,
    similarity_threshold: float = 0.4,
    retrieval_weight: float = 0.3,
    llm_weight: float = 0.7,
) -> SyllabusCoverage:
    try:
        return await service.compute_coverage(
            user_id=user.uid,
            syllabus_id=syllabus_id,
            document_ids=document_ids,
            similarity_threshold=similarity_threshold,
            retrieval_weight=retrieval_weight,
            llm_weight=llm_weight,
        )
    except SyllabusNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SyllabusValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{syllabus_id}/coverage", response_model=SyllabusCoverage)
async def get_coverage(
    syllabus_id: str,
    user: CurrentUser,
    service: SyllabusServiceDep,
) -> SyllabusCoverage:
    coverage = await service.get_coverage(user.uid, syllabus_id)
    if not coverage:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="Syllabus coverage not calculated yet"
        )
    return coverage
