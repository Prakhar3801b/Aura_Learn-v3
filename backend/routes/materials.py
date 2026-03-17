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
from services.embedding_service import EmbeddingService
from models.material import MaterialUploadResponse, ProcessingStatus, FileType
from datetime import datetime

router = APIRouter(prefix="/materials", tags=["Materials"])
logger = logging.getLogger(__name__)
settings = get_settings()

pdf_service = PDFService()
ocr_service = OCRService()
whisper_service = WhisperService()
ai_service = AIService()
embedding_service = EmbeddingService()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def sanitize_filename(filename: str) -> str:
    """Sanitize filename by removing potentially problematic characters."""
    import re
    import unicodedata

    # Normalize unicode characters to replace ones like '🏺' with something safe if possible, 
    # but here we mostly want to strip/replace them.
    filename = unicodedata.normalize('NFKD', filename).encode('ascii', 'ignore').decode('ascii')
    
    # Remove any character that isn't a word character, dot, or hyphen
    filename = re.sub(r'[^\w\.\-]', '_', filename)
    
    # Remove duplicate underscores
    filename = re.sub(r'_+', '_', filename)
    
    return filename.strip('_')


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

        ai_result = await ai_service.process_material(text, material_id, transcript_segments)

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

        # Function to store graphs (Mind Map / Concept Graph)
        def store_graph(graph, gtype, prefix):
            node_rows = [
                {
                    "id": f"{material_id}_{prefix}_{node.id}",
                    "material_id": material_id,
                    "label": node.label,
                    "topic": node.topic,
                    "description": node.description,
                    "video_timestamp": node.video_timestamp,
                    "video_timestamp_label": node.video_timestamp_label,
                    "node_type": node.node_type,
                    "color": node.color,
                    "graph_type": gtype
                }
                for node in graph.nodes
            ]
            if node_rows:
                supabase.table("mind_map_nodes").insert(node_rows).execute()

            edge_rows = [
                {
                    "id": f"{material_id}_{prefix}_{edge.id}",
                    "material_id": material_id,
                    "source": f"{material_id}_{prefix}_{edge.source}",
                    "target": f"{material_id}_{prefix}_{edge.target}",
                    "label": edge.label,
                    "graph_type": gtype
                }
                for edge in graph.edges
            ]
            if edge_rows:
                supabase.table("mind_map_edges").insert(edge_rows).execute()

        # Store Mind Map
        store_graph(ai_result.mind_map, "mindmap", "mm")
        # Store Concept Graph
        store_graph(ai_result.concept_graph, "conceptgraph", "cg")

        # 5. Chunk and Embed for RAG
        chunks = pdf_service.chunk_text(text)
        if chunks:
            chunk_texts = [c["text"] for c in chunks]
            embeddings = embedding_service.embed_texts(chunk_texts)
            
            chunk_rows = [
                {
                    "id": str(uuid.uuid4()),
                    "material_id": material_id,
                    "chunk_index": i,
                    "text": c["text"],
                    "embedding": embeddings[i],
                    "char_start": c["char_start"],
                    "char_end": c["char_end"],
                }
                for i, c in enumerate(chunks)
            ]
            if chunk_rows:
                # Use standard insert for chunks
                supabase.table("material_chunks").insert(chunk_rows).execute()

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
    # Validate config before proceeding
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(500, "Backend is missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.")

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

    try:
        file_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(400, f"Failed to read uploaded file: {e}")

    material_id = str(uuid.uuid4())
    safe_filename = sanitize_filename(file.filename or "unnamed_file")
    storage_path = f"{user_id}/{material_id}/{safe_filename}"

    try:
        # Upload to Supabase Storage
        supabase.storage.from_("study-materials").upload(
            storage_path, file_bytes, {"content-type": content_type}
        )
        file_url = supabase.storage.from_("study-materials").get_public_url(storage_path)
    except Exception as e:
        logger.error(f"Supabase storage upload failed: {e}")
        raise HTTPException(500, f"Failed to upload file to storage: {e}")

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
    try:
        supabase.table("study_materials").insert(row).execute()
    except Exception as e:
        logger.error(f"Failed to insert material row: {e}")
        raise HTTPException(500, f"Failed to save material metadata: {e}")

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


@router.delete("/{material_id}")
async def delete_material(material_id: str, user_id: str):
    """Delete a study material and its associated assets."""
    supabase = get_supabase()
    
    # 1. Check ownership and get file path
    res = supabase.table("study_materials").select("user_id, file_url").eq("id", material_id).single().execute()
    if not res.data or res.data["user_id"] != user_id:
        raise HTTPException(403, "Not authorized to delete this material")
        
    # 2. Extract storage path from URL and delete if exists
    file_url = res.data.get("file_url", "")
    if "study-materials/" in file_url:
        try:
            storage_path = file_url.split("study-materials/")[1]
            supabase.storage.from_("study-materials").remove([storage_path])
        except Exception as e:
            logger.warning(f"Failed to delete storage file: {e}")

    # 3. Delete DB row (ON DELETE CASCADE handles children)
    supabase.table("study_materials").delete().eq("id", material_id).execute()
    return {"deleted": True}


class BatchDeleteRequest(BaseModel):
    material_ids: List[str]
    user_id: str

@router.request("DELETE", "/batch")
async def delete_materials_batch(request: BatchDeleteRequest):
    """Batch delete study materials."""
    supabase = get_supabase()
    
    # 1. Fetch materials to verify ownership and get file paths
    mats = (
        supabase.table("study_materials")
        .select("id, user_id, file_url")
        .in_("id", request.material_ids)
        .execute()
    )
    
    valid_ids = []
    storage_paths = []
    for m in mats.data:
        if m["user_id"] == request.user_id:
            valid_ids.append(m["id"])
            file_url = m.get("file_url", "")
            if "study-materials/" in file_url:
                storage_paths.append(file_url.split("study-materials/")[1])
                
    if not valid_ids:
        return {"deleted": 0}
        
    # 2. Delete from storage
    if storage_paths:
        try:
            supabase.storage.from_("study-materials").remove(storage_paths)
        except Exception as e:
            logger.warning(f"Batch storage deletion warning: {e}")
            
    # 3. Delete from DB
    res = supabase.table("study_materials").delete().in_("id", valid_ids).execute()
    
    return {"deleted": len(valid_ids)}

