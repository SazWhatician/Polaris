from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.core.config import Settings
from app.core.logging import get_logger

log = get_logger(__name__)


def configure_tracing(settings: Settings) -> None:
    """Wire OTel SDK to an OTLP collector (Jaeger). Safe to call once at startup."""
    if not settings.otel_exporter_otlp_endpoint:
        log.info("otel.disabled", reason="OTEL_EXPORTER_OTLP_ENDPOINT not set")
        return

    resource = Resource.create(
        {
            SERVICE_NAME: settings.otel_service_name,
            "service.env": settings.app_env,
        }
    )
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        HTTPXClientInstrumentor().instrument()
        log.info("otel.configured", endpoint=settings.otel_exporter_otlp_endpoint)
    except Exception as exc:
        log.warning("otel.httpx_instrument_failed", error=str(exc))


def instrument_app(app: FastAPI) -> None:
    """Auto-instrument FastAPI. Call AFTER app routes are registered."""
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app, excluded_urls="/health,/docs,/openapi.json")
    except Exception as exc:
        log.warning("otel.fastapi_instrument_failed", error=str(exc))
