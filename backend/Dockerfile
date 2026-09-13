# syntax=docker/dockerfile:1.7

# ---- Stage 1: builder ----
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install --upgrade pip setuptools wheel \
 && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt \
 && find /opt/venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true \
 && find /opt/venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true \
 && find /opt/venv -type f -name "*.pyc" -delete

# ---- Stage 2: runtime ----
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    HF_HOME="/home/app/.cache/huggingface"

# Non-root user with UID 1000 for Hugging Face Spaces & security
RUN groupadd -g 1000 app && useradd -u 1000 -g 1000 --create-home --shell /bin/bash app

WORKDIR /app

# Copy optimized venv from builder
COPY --from=builder --chown=app:app /opt/venv /opt/venv

# Pre-bake embedding model as app user for ultra-fast startup (~70 MB)
USER app
RUN mkdir -p /home/app/.cache/huggingface \
 && python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy application source
COPY --chown=app:app app ./app

ENV PORT=7860
EXPOSE 7860 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys,os; port=os.environ.get('PORT','7860'); sys.exit(0) if urllib.request.urlopen(f'http://127.0.0.1:{port}/health', timeout=2).status==200 else sys.exit(1)"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
