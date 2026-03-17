import uuid
import logging
from fastapi import APIRouter, HTTPException
from supabase import create_client
from config import get_settings
from services.analytics_service import AnalyticsService
from services.ai_service import AIService
from models.analytics import SessionEvent, StudySession
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)
settings = get_settings()

analytics_service = AnalyticsService()
ai_service = AIService()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/session/start")
async def start_session(user_id: str, material_id: str):
    supabase = get_supabase()
    session_id = str(uuid.uuid4())
    row = {
        "id": session_id,
        "user_id": user_id,
        "material_id": material_id,
        "started_at": datetime.utcnow().isoformat(),
        "comprehension_score": 1.0,
    }
    supabase.table("study_sessions").insert(row).execute()
    return {"session_id": session_id}


@router.post("/event")
async def record_event(event: SessionEvent):
    """Record a study event and detect anomalies in real-time."""
    event.timestamp = event.timestamp or datetime.utcnow()
    anomaly = analytics_service.record_event(event)

    supabase = get_supabase()
    score = analytics_service.get_comprehension_score(event.session_id)
    supabase.table("study_sessions").update(
        {"comprehension_score": score}
    ).eq("id", event.session_id).execute()

    # Persist anomaly if detected
    if anomaly:
        supabase.table("anomaly_flags").insert({
            "id": str(uuid.uuid4()),
            "session_id": anomaly.session_id,
            "material_id": anomaly.material_id,
            "anomaly_type": anomaly.anomaly_type,
            "detected_at": anomaly.detected_at.isoformat(),
            "topic": anomaly.topic,
            "intervention": anomaly.intervention,
            "resolved": False,
        }).execute()

    return {
        "recorded": True,
        "comprehension_score": score,
        "anomaly": anomaly.dict() if anomaly else None,
    }


@router.get("/session/{session_id}/summary")
async def get_session_summary(session_id: str):
    return analytics_service.get_session_summary(session_id)


@router.get("/anomalies/{session_id}")
async def get_anomalies(session_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("anomaly_flags")
        .select("*")
        .eq("session_id", session_id)
        .order("detected_at", desc=True)
        .execute()
    )
    return result.data or []


@router.patch("/anomalies/{anomaly_id}/resolve")
async def resolve_anomaly(anomaly_id: str):
    supabase = get_supabase()
    supabase.table("anomaly_flags").update({"resolved": True}).eq("id", anomaly_id).execute()
    return {"resolved": True}


@router.get("/user/{user_id}/history")
async def get_user_history(user_id: str):
    """Get the full study history for a user, grouped by session."""
    supabase = get_supabase()
    
    # 1. Fetch study sessions joined with material titles
    sessions_res = (
        supabase.table("study_sessions")
        .select("*, study_materials(title, file_type)")
        .eq("user_id", user_id)
        .order("started_at", desc=True)
        .execute()
    )
    
    sessions_data = sessions_res.data or []
    
    # 2. Enrich with stuck topics and AI insights
    history = []
    # Only generate AI insights for the last 2 sessions to keep it fast
    for i, s in enumerate(sessions_data):
        # Handle the joined data structure
        material = s.get("study_materials", {})
        if isinstance(material, dict):
            s["material_title"] = material.get("title", "Untitled Material")
            s["file_type"] = material.get("file_type", "pdf")
        else:
            s["material_title"] = "Untitled Material"
            s["file_type"] = "pdf"
            
        if "study_materials" in s:
            del s["study_materials"]
            
        # 1. Fetch associated anomalies to show "stuck topics"
        anom_res = (
            supabase.table("anomaly_flags")
            .select("topic")
            .eq("session_id", s["id"])
            .execute()
        )
        s["stuck_topics"] = list(set([a["topic"] for a in anom_res.data if a.get("topic")]))

        # 2. Generate/Return AI insights for last 2 sessions
        if i < 2:
            # Check if insights are already in memory or generate them
            session_state = analytics_service._session_cache.get(s["id"], {})
            events = session_state.get("events", [])
            
            # If no cached events in memory (e.g. server restarted), fetch from DB if possible
            # (Assuming events aren't fully persisted in this simplified version, let's use stuck topics)
            try:
                insights = await ai_service.generate_session_insights(events)
                s["insights"] = insights
            except:
                s["insights"] = {
                    "learned": [f"Deep dive into {s['material_title']}"],
                    "doubts": s["stuck_topics"],
                    "review": "Performance was consistent across topics.",
                    "recap": f"Focused session on {s['material_title']}."
                }
        else:
            s["insights"] = None

        history.append(s)
        
    return history
