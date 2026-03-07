# ── Aura Learn V3 Backend ──
# FastAPI + Whisper + Tesseract OCR
# Deploy on Render: Runtime = Docker

FROM python:3.11-slim

# System deps for building wheels + runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    curl \
    git \
    ffmpeg \
    tesseract-ocr \
    libtesseract-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Rust toolchain (required by tiktoken / openai-whisper)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Upgrade pip first
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
