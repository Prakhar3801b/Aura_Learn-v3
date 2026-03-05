import uuid
import tempfile
import os
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from supabase import create_client
from config import get_settings
from services.pdf_service import PDFService
from services.ocr_service import OCRService
from services.whisper_service import WhisperService
from services.ai_service import AIService
from models.material import MaterialUploadResponse, ProcessingStatus, FileType
from datetime import datetime

router = APIRouter(prefix="/materials", tags=["Materials"])
logger = logging.getLogger(__name__)
settings = get_settings()

pdf_service = PDFService()
ocr_service = OCRService()
whisper_service = WhisperService(model_size=settings.whisper_model)
ai_service = AIService()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def process_material_background(
    material_id: str, file_bytes: bytes, file_type: str, filename: str
):
    """Background task: extract text, run AI pipeline, store results."""
    supabase = get_supabase()
    try:
        supabase.table("study_materials").update(
            {"status": ProcessingStatus.processing.value}
        ).eq("id", material_id).execute()

        text = ""
        transcript_segments = None

        if file_type == "pdf":
            text = pdf_service.extract_text_from_bytes(file_bytes)

        elif file_type == "image":
            text = ocr_service.extract_from_image_bytes(file_bytes)

        elif file_type == "video":
            suffix = os.path.splitext(filename)[1] or ".mp4"
            result = whisper_service.transcribe_bytes(file_bytes, suffix=suffix)
            text = result["text"]
            transcript_segments = result["segments"]

        if not text:
            raise ValueError("Could not extract text from material")

        ai_result = ai_service.process_material(text, material_id, transcript_segments)

        # Store flashcards
        flashcard_rows = [
            {
                "id": str(uuid.uuid4()),
                "material_id": material_id,
                "question": fc.question,
                "answer": fc.answer,
                "difficulty": fc.difficulty,
                "topic": fc.topic,
                "confidence_score": fc.confidence_score,
            }
            for fc in ai_result.flashcards
        ]
        if flashcard_rows:
            supabase.table("flashcards").insert(flashcard_rows).execute()

        # Store exam points
        exam_rows = [
            {
                "id": str(uuid.uuid4()),
                "material_id": material_id,
                "point": ep.point,
                "topic": ep.topic,
                "importance": ep.importance,
            }
            for ep in ai_result.exam_points
        ]
        if exam_rows:
            supabase.table("exam_points").insert(exam_rows).execute()

        # Store mind map nodes
        node_rows = [
            {
                "id": node.id,
                "material_id": material_id,
                "label": node.label,
                "topic": node.topic,
                "description": node.description,
                "video_timestamp": node.video_timestamp,
                "video_timestamp_label": node.video_timestamp_label,
                "node_type": node.node_type,
                "color": node.color,
            }
            for node in ai_result.mind_map.nodes
        ]
        if node_rows:
            supabase.table("mind_map_nodes").insert(node_rows).execute()

        # Store mind map edges
        edge_rows = [
            {
                "id": edge.id,
                "material_id": material_id,
                "source": edge.source,
                "target": edge.target,
                "label": edge.label,
            }
            for edge in ai_result.mind_map.edges
        ]
        if edge_rows:
            supabase.table("mind_map_edges").insert(edge_rows).execute()

        supabase.table("study_materials").update(
            {"status": ProcessingStatus.completed.value}
        ).eq("id", material_id).execute()

        logger.info(f"Material {material_id} processed in {ai_result.processing_time_seconds}s")

    except Exception as e:
        logger.error(f"Processing failed for {material_id}: {e}")
        supabase.table("study_materials").update(
            {"status": ProcessingStatus.failed.value}
        ).eq("id", material_id).execute()


@router.post("/upload", response_model=MaterialUploadResponse)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    user_id: str = Form(...),
):
    """Upload a study material (PDF, image, or video) and trigger AI processing."""
    supabase = get_supabase()

    content_type = file.content_type or ""
    if "pdf" in content_type:
        file_type = FileType.pdf
    elif any(t in content_type for t in ["image/", "png", "jpg", "jpeg", "webp"]):
        file_type = FileType.image
    elif any(t in content_type for t in ["video/", "mp4", "webm", "mpeg"]):
        file_type = FileType.video
    else:
        extension = os.path.splitext(file.filename or "")[1].lower()
        if extension == ".pdf":
            file_type = FileType.pdf
        elif extension in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
            file_type = FileType.image
        elif extension in [".mp4", ".webm", ".mov", ".avi"]:
            file_type = FileType.video
        else:
            raise HTTPException(400, "Unsupported file type. Upload PDF, image, or video.")

    file_bytes = await file.read()
    material_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{material_id}/{file.filename}"

    # Upload to Supabase Storage
    supabase.storage.from_("study-materials").upload(
        storage_path, file_bytes, {"content-type": content_type}
    )
    file_url = supabase.storage.from_("study-materials").get_public_url(storage_path)

    # Insert metadata row
    row = {
        "id": material_id,
        "user_id": user_id,
        "title": title,
        "file_type": file_type.value,
        "file_url": file_url,
        "status": ProcessingStatus.pending.value,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("study_materials").insert(row).execute()

    # Kick off background processing
    background_tasks.add_task(
        process_material_background, material_id, file_bytes, file_type.value, file.filename or ""
    )

    return MaterialUploadResponse(**row)


@router.get("/{material_id}")
async def get_material(material_id: str):
    supabase = get_supabase()
    result = supabase.table("study_materials").select("*").eq("id", material_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Material not found")
    return result.data


@router.get("/user/{user_id}")
async def list_user_materials(user_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("study_materials")
        .select("id, title, file_type, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
