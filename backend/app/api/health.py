from fastapi import APIRouter
from pydantic import BaseModel

from app.core.firebase import is_initialized

router = APIRouter(tags=["meta"])


class HealthResponse(BaseModel):
    status: str
    firebase_ready: bool


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", firebase_ready=is_initialized())
