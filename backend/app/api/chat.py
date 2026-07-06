import json

from fastapi import APIRouter, HTTPException, Request, status
from sse_starlette.sse import EventSourceResponse

from app.core.deps import CurrentUser
from app.models.rag import ChatRequest
from app.services.rag_service import RagService

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _get_rag_service(request: Request) -> RagService:
    svc = getattr(request.app.state, "rag_service", None)
    if svc is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG backend unavailable — check Qdrant / Groq config",
        )
    return svc


@router.post("/stream")
async def chat_stream(body: ChatRequest, user: CurrentUser, request: Request):
    """Stream a grounded answer as Server-Sent Events.

    Event types:
      * ``citations`` — one event, payload `{citations: [...]}` with retrieved chunks.
      * ``token`` — many events, payload `{content: "..."}` with one token chunk.
      * ``done`` — one event, payload `{}`. Marks end of stream.

    If the client disconnects mid-stream, the generator detects it and exits;
    Groq's stream is not explicitly cancelled here (best-effort).
    """
    rag = _get_rag_service(request)

    async def event_gen():
        async for event in rag.stream_answer(
            user_id=user.uid,
            question=body.question,
            document_ids=body.document_ids,
            top_k=body.top_k,
        ):
            if await request.is_disconnected():
                break
            yield {
                "event": str(event["type"]),
                "data": json.dumps(event),
            }

    return EventSourceResponse(event_gen())
