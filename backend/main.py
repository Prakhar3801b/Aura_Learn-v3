import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routes import materials, ai, analytics, xr

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="Aura Learn V3 API",
    description="AI-powered study platform backend: multimodal processing, flashcards, mind maps, and WebXR lab data.",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(xr.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Aura Learn V3 API",
        "version": "3.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
