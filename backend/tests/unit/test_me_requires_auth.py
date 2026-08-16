from httpx import AsyncClient


async def test_me_returns_503_without_firebase(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "is_initialized", lambda: False)
    response = await client.get("/api/me")
    assert response.status_code == 503


async def test_me_rejects_missing_bearer_when_firebase_ready(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "is_initialized", lambda: True)
    response = await client.get("/api/me")
    assert response.status_code == 401
    assert "bearer" in response.json()["detail"].lower()
