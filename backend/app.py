import os
import uvicorn
import gradio as gr
from app.main import app as fastapi_app

# Lightweight Gradio status card for Hugging Face Spaces
with gr.Blocks(title="Polaris Academic AI Backend") as demo:
    gr.Markdown("# 🌌 Polaris Academic AI Backend")
    gr.Markdown("The Polaris FastAPI backend engine is active and serving requests.")
    gr.Markdown("- **Interactive Swagger Docs**: [`/docs`](/docs)")
    gr.Markdown("- **Service Health**: [`/health`](/health)")

# Mount Gradio onto FastAPI app:
# Gradio UI served at /gradio or root, while all FastAPI routes (/health, /api, /chat, etc.) work natively
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
