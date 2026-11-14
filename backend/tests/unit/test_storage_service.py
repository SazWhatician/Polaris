from pathlib import Path
from unittest.mock import patch

import pytest
from app.services.storage_service import StorageService


def test_storage_dir_fallback_on_permission_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("STORAGE_DIR", "/nonexistent/denied/storage")

    orig_mkdir = Path.mkdir

    def mock_mkdir(self: Path, *args: object, **kwargs: object) -> None:
        if "denied" in str(self):
            raise PermissionError("[Errno 13] Permission denied")
        orig_mkdir(self, *args, **kwargs)

    with patch.object(Path, "mkdir", mock_mkdir):
        service = StorageService()
        assert service._storage_dir != Path("/nonexistent/denied/storage")
        assert service._storage_dir.exists()


def test_storage_dir_custom_path(tmp_path: Path) -> None:
    target = tmp_path / "custom_storage"
    service = StorageService(storage_dir=target)
    assert service._storage_dir == target
    assert target.is_dir()
