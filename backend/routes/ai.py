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


class PracticalEvaluateRequest(BaseModel):
    challenge: str
    answer: str

@router.post("/practical/generate/{material_id}")
async def generate_practical(material_id: str):
    """Generate a practical study challenge."""
    try:
        text = await rag_service.get_material_text(material_id)
        if not text:
            raise HTTPException(404, "No content found for this material")
        challenge = await rag_service.ai_service.generate_practical_challenge(text)
        return challenge
    except Exception as e:
        logger.error(f"Practical generation failed: {e}")
        raise HTTPException(500, str(e))

@router.post("/practical/evaluate/{material_id}")
async def evaluate_practical(material_id: str, request: PracticalEvaluateRequest):
    """Evaluate a student's answer to a practical challenge."""
    try:
        text = await rag_service.get_material_text(material_id)
        feedback = await rag_service.ai_service.evaluate_practical_answer(text, request.challenge, request.answer)
        return {"feedback": feedback}
    except Exception as e:
        logger.error(f"Practical evaluation failed: {e}")
        raise HTTPException(500, str(e))

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[str] = None

class MultiChatRequest(BaseModel):
    material_ids: List[str]
    question: str
    user_id: Optional[str] = None

@router.post("/chat-multi")
async def chat_multi(request: MultiChatRequest):
    """Chat across multiple study materials."""
    try:
        result = await rag_service.answer_question(request.material_ids, request.question, request.user_id)
        return result
    except Exception as e:
        logger.error(f"Multi-Chat failed: {e}")
        raise HTTPException(500, str(e))

@router.post("/chat/{material_id}")
async def chat_with_material(material_id: str, request: ChatRequest):
    """Chat with the study material using RAG."""
    try:
        result = await rag_service.answer_question(material_id, request.question, request.user_id)
        return result
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(500, str(e))
