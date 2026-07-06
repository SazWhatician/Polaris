import logging
import sys
import uuid
from contextvars import ContextVar

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.core.config import Settings

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def configure_logging(settings: Settings) -> None:
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=settings.log_level,
    )

    processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        _inject_request_id,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.is_dev:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.log_level)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def _inject_request_id(
    _logger: object, _method: str, event_dict: dict[str, object]
) -> dict[str, object]:
    event_dict["request_id"] = request_id_var.get()
    return event_dict


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Read X-Request-Id or mint one; expose it in logs + response header."""

    HEADER = "X-Request-Id"

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        rid = request.headers.get(self.HEADER) or uuid.uuid4().hex
        token = request_id_var.set(rid)
        try:
            response: Response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers[self.HEADER] = rid
        return response


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)  # type: ignore[return-value]
