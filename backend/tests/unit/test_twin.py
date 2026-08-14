import pytest
from app.models.twin import TwinSignal
from app.services.twin_service import TwinService


@pytest.mark.asyncio
async def test_twin_service_init_and_signal_ingest():
    twin_service = TwinService()
    user_id = "test_user_123"

    twin = await twin_service.get_twin(user_id)
    assert twin.user_id == user_id

    signal = TwinSignal(source="chat", concept_id="neural_networks")
    updated_twin = await twin_service.ingest_signal(user_id, signal)
    assert updated_twin.signals_count == 1


def test_twin_service_readiness_check():
    twin_service = TwinService()
    user_id = "test_user_123"

    readiness = twin_service.check_readiness(user_id, "linear_algebra")
    assert readiness["target_concept"] is not None
    assert "ready" in readiness
