from httpx import AsyncClient


async def test_me_returns_503_without_firebase(client: AsyncClient) -> None:
    # Firebase is not initialized in test env, so the dependency short-circuits to 503
    # rather than 401 — distinguishes "server misconfigured" from "client unauthorized".
    response = await client.get("/api/me")
    assert response.status_code == 503


async def test_me_rejects_missing_bearer_when_firebase_ready(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "_initialized", True)
    try:
        response = await client.get("/api/me")
        assert response.status_code == 401
        assert "bearer" in response.json()["detail"].lower()
    finally:
        monkeypatch.setattr(firebase, "_initialized", False)
