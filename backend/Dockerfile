# ── Aura Learn V3 Backend ──
# FastAPI + Whisper + Tesseract OCR
# Deploy on Render as a Docker web service

FROM python:3.11-slim

# System deps: ffmpeg (Whisper), tesseract (OCR), build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    tesseract-ocr \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Render injects PORT env var at runtime
ENV PORT=8000

EXPOSE ${PORT}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
