from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class Badge(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    awarded_at: datetime


class UserRewards(BaseModel):
    user_id: str
    streak_count: int = 0
    last_study_date: Optional[date] = None
    badges: List[Badge] = []
    understandings_score: float = 0.0
    total_study_minutes: int = 0
