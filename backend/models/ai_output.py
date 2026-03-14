from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FlashCard(BaseModel):
    id: Optional[str] = None
    material_id: str
    question: str
    answer: str
    difficulty: str = "medium"  # easy, medium, hard
    topic: str = ""
    confidence_score: float = 0.5  # 0-1, updated by user responses


class ExamPoint(BaseModel):
    id: Optional[str] = None
    material_id: str
    point: str
    topic: str
    importance: str = "high"  # critical, high, medium
    page_reference: Optional[str] = None


class MindMapNode(BaseModel):
    id: str
    material_id: str
    label: str
    topic: str
    description: str
    video_timestamp: Optional[float] = None
    video_timestamp_label: Optional[str] = None
    node_type: str = "concept"  # root, concept, detail, relation
    color: Optional[str] = None
    graph_type: str = "mindmap"  # mindmap, conceptgraph

class MindMapEdge(BaseModel):
    id: str
    material_id: str
    source: str
    target: str
    label: Optional[str] = None
    graph_type: str = "mindmap"  # mindmap, conceptgraph

class MindMapGraph(BaseModel):
    material_id: str
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]
    graph_type: str = "mindmap"

class AIProcessingResult(BaseModel):
    material_id: str
    flashcards: List[FlashCard]
    exam_points: List[ExamPoint]
    mind_map: MindMapGraph
    concept_graph: MindMapGraph
    processing_time_seconds: float
    model_used: str
