from fastapi import APIRouter
from pydantic import BaseModel

from app.core.supabase import is_initialized

router = APIRouter(tags=["meta"])


class HealthResponse(BaseModel):
    status: str
    supabase_ready: bool
    firebase_ready: bool = True  # Backward compatibility


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    ready = is_initialized()
    return HealthResponse(status="ok", supabase_ready=ready, firebase_ready=ready)
