# ── Aura Learn V3 Backend ──
# FastAPI + Groq Whisper API + Groq Llama 3.3 + Tesseract OCR
# Deploy on Render: Runtime = Docker

FROM python:3.11-slim

# System deps for Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Render injects PORT at runtime, default to 8000
ENV PORT=8000

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
