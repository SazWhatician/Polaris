# Polyfill for Python runtime compatibility
import datetime
if not hasattr(datetime, "UTC"):
    from datetime import timezone
    datetime.UTC = timezone.utc

import enum
if not hasattr(enum, "StrEnum"):
    from enum import Enum
    class StrEnum(str, Enum):
        pass
    enum.StrEnum = StrEnum

import sys
import types
try:
    import sse_starlette
    if "sse_starlette.event" not in sys.modules:
        import sse_starlette.sse as _sse
        _event_mod = types.ModuleType("sse_starlette.event")
        _event_mod.ServerSentEvent = getattr(_sse, "ServerSentEvent", None)
        _event_mod.JSONServerSentEvent = getattr(_sse, "JSONServerSentEvent", None)
        sys.modules["sse_starlette.event"] = _event_mod
        sse_starlette.event = _event_mod
except ImportError:
    pass

import os
# Ensure Gradio 6 does not attempt Node SSR proxy (which conflicts with ZeroGPU sidecar on 7861)
os.environ["GRADIO_NODE_PATH"] = ""
os.environ["GRADIO_SSR_MODE"] = "False"

try:
    import gradio as gr
    import spaces
    HAS_GRADIO = True
except ImportError:
    HAS_GRADIO = False
    gr = None
    spaces = None

from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from app.main import app as fastapi_app
from app.core.config import get_settings

settings = get_settings()

if HAS_GRADIO and gr is not None and spaces is not None:
    # ZeroGPU requires at least one registered Gradio component/event decorated with @spaces.GPU
    @spaces.GPU
    def zerogpu_inference(prompt: str) -> str:
        """ZeroGPU inference bridge."""
        return f"ZeroGPU active: {prompt}"

    with gr.Blocks(title="Polaris Academic AI API") as demo:
        gr.Markdown("# 🌌 Polaris Academic AI Backend")
        gr.Markdown("ZeroGPU Engine is Active & Ready.")
        gr.Markdown("- **Interactive Swagger Docs**: [`/docs`](/docs)")
        gr.Markdown("- **Health Status**: [`/health`](/health)")

        with gr.Row():
            test_in = gr.Textbox(label="Test Input", placeholder="Ping ZeroGPU...", visible=False)
            test_out = gr.Textbox(label="Output", visible=False)
        test_btn = gr.Button("Trigger GPU", visible=False)
        test_btn.click(fn=zerogpu_inference, inputs=test_in, outputs=test_out)

    # Include all Polaris FastAPI routes into Gradio's underlying FastAPI app
    demo.app.include_router(fastapi_app.router)

    from app.core.supabase import initialize_supabase
    from app.core.firebase import initialize_firebase
    from app.main import get_rag_service_singleton

    initialize_supabase(settings)
    initialize_firebase(settings)
    demo.app.state.rag_service = get_rag_service_singleton()

    # Add CORS middleware to demo.app for frontend Vercel calls
    demo.app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id"],
    )

    # Interactive Swagger UI route
    @demo.app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(openapi_url="/openapi.json", title="Polaris API Docs")

    # Expose app for ASGI servers if needed
    app = demo.app

    if __name__ == "__main__":
        port = int(os.environ.get("PORT", 7860))
        demo.launch(
            _app=demo.app,
            server_name="0.0.0.0",
            server_port=port,
            ssr_mode=False,
        )
else:
    app = fastapi_app

    if __name__ == "__main__":
        import uvicorn
        port = int(os.environ.get("PORT", 7860))
        uvicorn.run("app.main:app", host="0.0.0.0", port=port)
