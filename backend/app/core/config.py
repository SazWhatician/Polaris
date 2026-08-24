from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "polaris-backend"
    app_env: Literal["dev", "test", "prod"] = "dev"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    allowed_origins: str = "http://localhost:3000"

    # --- Supabase ---
    supabase_url: str = ""
    supabase_key: str = ""  # Service role key for admin/backend
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "polaris-documents"

    # --- Legacy / optional Firebase fields ---
    firebase_project_id: str = "polaris-dev"
    firebase_credentials_path: str | None = None
    firebase_storage_bucket: str | None = None

    signed_url_ttl_seconds: int = 15 * 60  # 15 minutes for upload URLs
    max_upload_bytes: int = 500 * 1024 * 1024  # 500 MiB per file
    document_list_limit: int = 50

    redis_url: str = "redis://redis:6379"

    ocr_max_pages: int = 200
    ocr_render_scale: float = 2.0  # 2x DPI for OCR quality vs memory tradeoff
    ocr_job_timeout_seconds: int = 600
    ocr_max_retries: int = 3

    # --- Vector search / embeddings ---
    qdrant_url: str = "http://qdrant:6333"
    qdrant_api_key: str | None = None  # set for Qdrant Cloud
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384
    embedding_batch_size: int = 32

    # --- Chunking ---
    chunk_size: int = 800
    chunk_overlap: int = 100

    # --- LLM ---
    groq_api_key: str | None = None
    groq_api_keys: str | None = None  # comma-separated list of Groq keys
    groq_model: str = "openai/gpt-oss-120b"
    groq_judge_model: str = "openai/gpt-oss-120b"  # used by answer eval

    gemini_api_key: str | None = None
    gemini_api_keys: str | None = None  # comma-separated list of Gemini keys
    gemini_model: str = "gemini-1.5-flash"

    nvidia_nim_api_key: str | None = None
    nvidia_nim_api_keys: str | None = None
    nvidia_nim_model: str = "deepseek-ai/deepseek-v4-pro"

    @property
    def parsed_groq_api_keys(self) -> list[str]:
        if self.groq_api_keys:
            keys = [k.strip() for k in self.groq_api_keys.split(",") if k.strip()]
            if keys:
                return keys
        return [self.groq_api_key] if self.groq_api_key else []

    @property
    def parsed_gemini_api_keys(self) -> list[str]:
        if self.gemini_api_keys:
            keys = [k.strip() for k in self.gemini_api_keys.split(",") if k.strip()]
            if keys:
                return keys
        return [self.gemini_api_key] if self.gemini_api_key else []

    @property
    def parsed_nvidia_nim_api_keys(self) -> list[str]:
        if self.nvidia_nim_api_keys:
            keys = [k.strip() for k in self.nvidia_nim_api_keys.split(",") if k.strip()]
            if keys:
                return keys
        return [self.nvidia_nim_api_key] if self.nvidia_nim_api_key else []

    # --- External APIs ---
    youtube_api_key: str | None = None

    # --- RAG ---
    rag_top_k: int = 5
    rag_max_context_chars: int = 8000

    @property
    def qdrant_collection_name(self) -> str:
        """Collection per environment so dev / test / prod don't collide."""
        return f"polaris-{self.app_env}-chunks"

    otel_exporter_otlp_endpoint: str | None = None
    otel_service_name: str = "polaris-api"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_dev(self) -> bool:
        return self.app_env == "dev"

    @property
    def using_firebase_emulators(self) -> bool:
        import os

        return bool(
            os.getenv("FIRESTORE_EMULATOR_HOST") or os.getenv("FIREBASE_AUTH_EMULATOR_HOST")
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
