from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def _test_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://testserver")
    monkeypatch.delenv("OTEL_EXPORTER_OTLP_ENDPOINT", raising=False)
    monkeypatch.delenv("FIREBASE_CREDENTIALS_PATH", raising=False)
    # Force-clear the cached settings so each test sees the patched env.
    from app.core.config import get_settings

    get_settings.cache_clear()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    from app.core.config import get_settings
    from app.main import _build_app

    app = _build_app(get_settings())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        async with app.router.lifespan_context(app):
            yield ac
