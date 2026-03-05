from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SessionEvent(BaseModel):
    session_id: str
    event_type: str  # "pause", "wrong_answer", "re-read", "skip", "stuck"
    material_id: str
    topic: Optional[str] = None
    node_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[dict] = None


class AnomalyFlag(BaseModel):
    id: Optional[str] = None
    session_id: str
    material_id: str
    anomaly_type: str  # "comprehension_drop", "stuck_on_topic", "repeated_errors"
    detected_at: datetime
    topic: Optional[str] = None
    intervention: str  # "simplify_content", "suggest_ar_lab", "add_flashcard"
    resolved: bool = False


class StudySession(BaseModel):
    id: Optional[str] = None
    user_id: str
    material_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    comprehension_score: float = 0.5
    events_count: int = 0
    anomalies_count: int = 0
