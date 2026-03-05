from pydantic import BaseModel
from typing import Optional, List, Any


class ARLabScene(BaseModel):
    component: str  # A-Frame component name
    entities: List[dict]  # A-Frame entities configuration
    instructions: List[str]
    learning_outcomes: List[str]


class ARLab(BaseModel):
    id: str
    name: str
    category: str  # "physics", "chemistry", "biology"
    subject: str
    description: str
    difficulty: str  # "beginner", "intermediate", "advanced"
    duration_minutes: int
    thumbnail: str
    scene: ARLabScene
    requires_ar: bool = True
    tags: List[str] = []
