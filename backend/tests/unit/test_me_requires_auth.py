from httpx import AsyncClient


async def test_me_returns_401_without_bearer(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/me")
    assert response.status_code == 401


async def test_me_rejects_missing_bearer_when_firebase_ready(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "is_initialized", lambda: True)
    response = await client.get("/api/me")
    assert response.status_code == 401
    assert "bearer" in response.json()["detail"].lower()


async def test_me_accepts_demo_token(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "is_initialized", lambda: True)
    response = await client.get(
        "/api/me", headers={"Authorization": "Bearer demo-token-123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "demo-student-123"
    assert data["email"] == "student@polaris.edu"


async def test_me_accepts_user_token(
    client: AsyncClient, monkeypatch
) -> None:
    from app.core import firebase

    monkeypatch.setattr(firebase, "is_initialized", lambda: True)
    response = await client.get(
        "/api/me", headers={"Authorization": "Bearer user-alice-456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "user-alice-456"
