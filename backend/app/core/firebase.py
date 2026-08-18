from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket

from app.core.config import Settings
from app.core.logging import get_logger

log = get_logger(__name__)

_initialized: bool = False
_settings: Settings | None = None


def _default_bucket_name(project_id: str) -> str:
    return f"{project_id}.firebasestorage.app"


def initialize_firebase(settings: Settings) -> bool:
    """Initialize the Firebase Admin SDK once. Returns True on success.

    Non-fatal: if credentials are missing the app still boots, but any route
    requiring authenticated identity will return 503. This keeps /health and
    /docs reachable in a half-configured dev environment.
    """
    global _initialized, _settings
    if _initialized:
        return True

    try:
        firebase_admin.get_app()
        _initialized = True
        _settings = settings
        return True
    except ValueError:
        pass

    bucket_name = settings.firebase_storage_bucket or _default_bucket_name(
        settings.firebase_project_id
    )
    options: dict[str, Any] = {
        "projectId": settings.firebase_project_id,
        "storageBucket": bucket_name,
    }

    if settings.using_firebase_emulators:
        firebase_admin.initialize_app(options=options)
        _initialized = True
        _settings = settings
        log.info("firebase.initialized", mode="emulator", project=settings.firebase_project_id)
        return True

    # If credentials file path is given and exists, initialize with service account certificate
    if settings.firebase_credentials_path:
        cred_path = Path(settings.firebase_credentials_path)
        if cred_path.is_file():
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(cred, options)
            _initialized = True
            _settings = settings
            log.info(
                "firebase.initialized",
                mode="service-account",
                project=settings.firebase_project_id,
                bucket=bucket_name,
            )
            return True
        log.warning(
            "firebase.credentials_path_not_found",
            path=str(cred_path),
            fallback="project-id-verification",
        )

    # Fallback: Initialize with projectId for public ID token verification (Google OAuth certs)
    try:
        firebase_admin.initialize_app(options=options)
        _initialized = True
        _settings = settings
        log.info(
            "firebase.initialized",
            mode="project-id-verification",
            project=settings.firebase_project_id,
        )
        return True
    except Exception as exc:
        log.error("firebase.initialize_failed", error=str(exc))
        return False


def is_initialized() -> bool:
    return _initialized


def get_firestore() -> FirestoreClient:
    if not _initialized:
        raise RuntimeError("Firebase not initialized")
    return firestore.client()


def get_storage_bucket() -> Bucket:
    if not _initialized:
        raise RuntimeError("Firebase not initialized")
    return storage.bucket()
