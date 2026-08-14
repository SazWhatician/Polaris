from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user_id
from app.services.groq_client import GroqClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent-llm", tags=["Agent LLM Proxy"])


class AgentLLMRequest(BaseModel):
    prompt: str = Field(description="The prompt to send to the LLM router")
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    json_mode: bool = Field(default=False)


class AgentLLMResponse(BaseModel):
    text: str
    provider: str = "groq"


@router.post("/plan", response_model=AgentLLMResponse)
async def proxy_llm_plan(
    req: AgentLLMRequest,
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    """Server-side proxy for in-page PolarAssist copilot planning calls.
    Protects API keys from client exposure and applies server-side rate limits.
    """
    rag_service = getattr(request.app.state, "rag_service", None)
    groq_client: GroqClient | None = getattr(rag_service, "_groq", None) if rag_service else None

    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service currently unavailable.",
        )

    try:
        completion = await groq_client.complete(
            prompt=req.prompt,
            temperature=req.temperature,
            json_mode=req.json_mode,
        )
        return AgentLLMResponse(text=completion, provider="groq")
    except Exception as e:
        logger.error("Agent LLM proxy error for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM proxy completion failed: {e}",
        )
