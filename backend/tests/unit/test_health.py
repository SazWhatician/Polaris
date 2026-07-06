from httpx import AsyncClient


async def test_health_ok(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["firebase_ready"] is False  # no credentials in test env


async def test_request_id_echoed(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"X-Request-Id": "abc-123"})
    assert response.headers["X-Request-Id"] == "abc-123"


async def test_request_id_minted_when_missing(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert "X-Request-Id" in response.headers
    assert len(response.headers["X-Request-Id"]) >= 16
