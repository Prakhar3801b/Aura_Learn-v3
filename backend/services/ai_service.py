import json
import logging
import time
from typing import List, Optional, Dict, Any
from groq import Groq
from config import get_settings
from models.ai_output import FlashCard, ExamPoint, MindMapNode, MindMapEdge, MindMapGraph, AIProcessingResult

logger = logging.getLogger(__name__)
settings = get_settings()


FLASHCARD_PROMPT = """You are an expert study assistant. Given the following study material text, generate exactly {count} high-quality predictive flashcards that target the most likely exam questions.

Study Material:
{text}

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {{
    "question": "...",
    "answer": "...",
    "difficulty": "easy|medium|hard",
    "topic": "..."
  }}
]"""

EXAM_POINTS_PROMPT = """You are an expert exam coach. Given this study material, extract the {count} most critical exam points — facts, definitions, formulas, or concepts most likely to appear in exams.

Study Material:
{text}

Return ONLY a valid JSON array:
[
  {{
    "point": "...",
    "topic": "...",
    "importance": "critical|high|medium"
  }}
]"""

MINDMAP_PROMPT = """You are an expert knowledge graph builder. Analyze this study material and build a hierarchical mind map.

Study Material:
{text}

Return ONLY valid JSON with this structure:
{{
  "nodes": [
    {{
      "id": "n1",
      "label": "Main Topic",
      "topic": "chapter name",
      "description": "brief explanation",
      "node_type": "root|concept|detail",
      "color": "#7C3AED"
    }}
  ],
  "edges": [
    {{
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "label": "contains"
    }}
  ]
}}

Colors: root=#7C3AED, concept=#06B6D4, detail=#10B981. Create 8-15 nodes total."""


class AIService:
    """LLM orchestration using Groq (Llama 3) to generate study outputs."""

    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama3-70b-8192"

    def _chat(self, prompt: str, max_tokens: int = 4096) -> str:
        """Call Groq chat completion."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            raise

    def _safe_json_parse(self, text: str) -> Any:
        """Extract and parse JSON from model response, handling potential text artifacts."""
        text = text.strip()
        
        # Try to find JSON within code blocks first
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # If still failing, try to find the first '[' or '{' and last ']' or '}'
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback for models that add conversational text around JSON
            start_idx = min(text.find('['), text.find('{')) if '[' in text and '{' in text else (text.find('[') if '[' in text else text.find('{'))
            end_idx = max(text.rfind(']'), text.rfind('}')) + 1
            if start_idx != -1 and end_idx != 0:
                text = text[start_idx:end_idx]
            return json.loads(text)

    def generate_flashcards(self, text: str, material_id: str, count: int = 15) -> List[FlashCard]:
        """Generate predictive flashcards from study text."""
        prompt = FLASHCARD_PROMPT.format(text=text[:6000], count=count)
        raw = self._chat(prompt)
        data = self._safe_json_parse(raw)
        return [
            FlashCard(
                material_id=material_id,
                question=item["question"],
                answer=item["answer"],
                difficulty=item.get("difficulty", "medium"),
                topic=item.get("topic", ""),
            )
            for item in data
        ]

    def generate_exam_points(self, text: str, material_id: str, count: int = 20) -> List[ExamPoint]:
        """Generate targeted exam points from study text."""
        prompt = EXAM_POINTS_PROMPT.format(text=text[:6000], count=count)
        raw = self._chat(prompt)
        data = self._safe_json_parse(raw)
        return [
            ExamPoint(
                material_id=material_id,
                point=item["point"],
                topic=item.get("topic", ""),
                importance=item.get("importance", "high"),
            )
            for item in data
        ]

    def generate_mind_map(
        self,
        text: str,
        material_id: str,
        transcript_segments: Optional[List[Dict]] = None,
    ) -> MindMapGraph:
        """Generate an interactive mind map graph from study text."""
        prompt = MINDMAP_PROMPT.format(text=text[:6000])
        raw = self._chat(prompt)
        data = self._safe_json_parse(raw)

        nodes = []
        for node_data in data.get("nodes", []):
            # Try to link to a video segment if transcript is available
            video_ts = None
            video_ts_label = None
            if transcript_segments:
                for seg in transcript_segments:
                    if node_data["label"].lower() in seg["text"].lower():
                        video_ts = seg["start"]
                        video_ts_label = seg["timestamp_label"]
                        break

            nodes.append(
                MindMapNode(
                    id=node_data["id"],
                    label=node_data["label"],
                    topic=node_data.get("topic", ""),
                    description=node_data.get("description", ""),
                    video_timestamp=video_ts,
                    video_timestamp_label=video_ts_label,
                    node_type=node_data.get("node_type", "concept"),
                    color=node_data.get("color"),
                )
            )

        edges = [
            MindMapEdge(
                id=e["id"],
                source=e["source"],
                target=e["target"],
                label=e.get("label"),
            )
            for e in data.get("edges", [])
        ]

        return MindMapGraph(material_id=material_id, nodes=nodes, edges=edges)

    def process_material(
        self,
        text: str,
        material_id: str,
        transcript_segments: Optional[List[Dict]] = None,
    ) -> AIProcessingResult:
        """Run the full AI pipeline on extracted text."""
        start = time.time()

        flashcards = self.generate_flashcards(text, material_id)
        exam_points = self.generate_exam_points(text, material_id)
        mind_map = self.generate_mind_map(text, material_id, transcript_segments)

        return AIProcessingResult(
            material_id=material_id,
            flashcards=flashcards,
            exam_points=exam_points,
            mind_map=mind_map,
            processing_time_seconds=round(time.time() - start, 2),
            model_used=self.model,
        )
