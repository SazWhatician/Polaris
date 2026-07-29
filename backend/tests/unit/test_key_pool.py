"""Unit tests for KeyPool, GroqClient key rotation, and GeminiClient key rotation."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.gemini_client import GeminiClient
from app.services.groq_client import GroqClient
from app.services.key_pool import AllKeysOnCooldownError, KeyPool, KeyPoolEmptyError
from groq import RateLimitError


@pytest.mark.asyncio
async def test_key_pool_round_robin():
    pool = KeyPool(["key_a", "key_b", "key_c"])
    assert pool.total_keys == 3

    assert await pool.get_next_key() == "key_a"
    assert await pool.get_next_key() == "key_b"
    assert await pool.get_next_key() == "key_c"
    assert await pool.get_next_key() == "key_a"


@pytest.mark.asyncio
async def test_key_pool_empty():
    with pytest.raises(KeyPoolEmptyError):
        KeyPool([])


@pytest.mark.asyncio
async def test_key_pool_cooldown():
    pool = KeyPool(["key_a", "key_b"])
    key1 = await pool.get_next_key()  # key_a
    assert key1 == "key_a"

    # Mark key_b on cooldown
    await pool.mark_cooldown("key_b", duration_seconds=60.0)

    # Next call should skip key_b and return key_a again
    key2 = await pool.get_next_key()
    assert key2 == "key_a"


@pytest.mark.asyncio
async def test_key_pool_all_on_cooldown():
    pool = KeyPool(["key_a"])
    await pool.mark_cooldown("key_a", duration_seconds=60.0)

    with pytest.raises(AllKeysOnCooldownError):
        await pool.get_next_key()


@pytest.mark.asyncio
async def test_groq_client_multi_key_retry():
    pool = KeyPool(["key_1", "key_2"])
    client = GroqClient(key_pool=pool, model="llama-3.3-70b-versatile")

    # Mock AsyncGroq client
    mock_groq_client = MagicMock()

    # Create mock response
    mock_resp = MagicMock()
    mock_resp.choices = [MagicMock()]
    mock_resp.choices[0].message.content = "Success response"

    # First call raises RateLimitError, second succeeds
    req_mock = MagicMock()
    req_mock.url = "https://api.groq.com"
    err = RateLimitError(
        message="Rate limit hit",
        response=MagicMock(status_code=429, headers={}),
        body=None,
    )

    mock_groq_client.chat.completions.create = AsyncMock(side_effect=[err, mock_resp])

    with patch.object(client, "_get_client_for_key", return_value=mock_groq_client):
        res = await client.complete("Hello")
        assert res == "Success response"


@pytest.mark.asyncio
async def test_gemini_client_multi_key_retry():
    pool = KeyPool(["gem_key_1", "gem_key_2"])
    gemini = GeminiClient(key_pool=pool, model="gemini-1.5-flash")

    # Mock httpx AsyncClient
    mock_response_429 = MagicMock()
    mock_response_429.status_code = 429

    mock_response_200 = MagicMock()
    mock_response_200.status_code = 200
    mock_response_200.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Gemini answer"}]}}]
    }
    mock_response_200.raise_for_status = MagicMock()

    mock_http_client = AsyncMock()
    mock_http_client.post.side_effect = [mock_response_429, mock_response_200]

    with patch(
        "httpx.AsyncClient",
        return_value=MagicMock(
            __aenter__=AsyncMock(return_value=mock_http_client), __aexit__=AsyncMock()
        ),
    ):
        res = await gemini.complete("Hello")
        assert res == "Gemini answer"
