import logging
from fastapi import APIRouter, HTTPException
from supabase import create_client
from config import get_settings
from services.rag_service import RAGService
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)
settings = get_settings()
rag_service = RAGService()

class ChatRequest(BaseModel):
    question: str


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/flashcards/{material_id}")
async def get_flashcards(material_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("flashcards")
        .select("*")
        .eq("material_id", material_id)
        .order("difficulty")
        .execute()
    )
    return result.data or []


@router.patch("/flashcards/{flashcard_id}/confidence")
async def update_confidence(flashcard_id: str, score: float):
    """Update confidence score after student answers a flashcard."""
    if not 0 <= score <= 1:
        raise HTTPException(400, "Score must be between 0 and 1")
    supabase = get_supabase()
    supabase.table("flashcards").update({"confidence_score": score}).eq("id", flashcard_id).execute()
    return {"status": "updated"}


@router.get("/exampoints/{material_id}")
async def get_exam_points(material_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("exam_points")
        .select("*")
        .eq("material_id", material_id)
        .order("importance")
        .execute()
    )
    return result.data or []


@router.get("/mindmap/{material_id}")
async def get_mind_map(material_id: str):
    supabase = get_supabase()
    nodes_res = (
        supabase.table("mind_map_nodes")
        .select("*")
        .eq("material_id", material_id)
        .execute()
    )
    edges_res = (
        supabase.table("mind_map_edges")
        .select("*")
        .eq("material_id", material_id)
        .execute()
    )
    return {
        "material_id": material_id,
        "nodes": nodes_res.data or [],
        "edges": edges_res.data or [],
    }


@router.post("/process/{material_id}")
async def trigger_reprocess(material_id: str):
    """Manually trigger AI reprocessing for a material (admin use)."""
    from routes.materials import get_supabase as gs
    supabase = gs()
    mat = supabase.table("study_materials").select("*").eq("id", material_id).single().execute()
    if not mat.data:
        raise HTTPException(404, "Material not found")
    return {"status": "reprocessing queued", "material_id": material_id}


@router.post("/chat/{material_id}")
async def chat_with_material(material_id: str, request: ChatRequest):
    """Chat with the study material using RAG."""
    try:
        result = await rag_service.answer_question(material_id, request.question)
        return result
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(500, str(e))
