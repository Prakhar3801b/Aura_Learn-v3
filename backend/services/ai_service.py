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


CONCEPT_GRAPH_PROMPT = """You are an expert knowledge engineer. Analyze this study material and build a formal Concept Graph (bipartite graph).
A Concept Graph consists of:
1. Concept Nodes (Rectangles): Represent entities, attributes, or actions.
2. Relation Nodes (Ovals/Circles): Define how concepts link together (e.g., "Agent", "Location", "Attribute").
3. Arcs: Connect Concepts to Relations (never Concept to Concept or Relation to Relation).

Study Material:
{text}

Return ONLY valid JSON with this structure:
{{
  "nodes": [
    {{
      "id": "c1",
      "label": "Concept Name",
      "node_type": "concept",
      "description": "..."
    }},
    {{
      "id": "r1",
      "label": "RELATION",
      "node_type": "relation"
    }}
  ],
  "edges": [
    {{
      "id": "e1",
      "source": "c1",
      "target": "r1",
      "label": "arc"
    }},
    {{
      "id": "e2",
      "source": "r1",
      "target": "c2",
      "label": "arc"
    }}
  ]
}}

Ensure it is a valid bipartite graph. Create 10-20 nodes total."""


PRACTICAL_EXERCISE_PROMPT = """You are an expert tutor. Create a practical challenge or scenario based on the following study material. 
The challenge should test the student's ability to apply the concepts in a real-world context.

Study Material:
{text}

Return ONLY valid JSON with this structure:
{{
  "topic": "...",
  "challenge_type": "Case Study|Simulation|Exercise",
  "question": "The specific question or task for the student",
  "instructions": "Supporting details or context",
  "expected_outcome": "What a perfect answer should cover"
}}"""
SIMULATION_PROMPT = """You are an expert educational simulation engine.
Analyze the following study material and convert a core concept into a clean, interactive, and visually structured simulation.

INPUT:
{text}

GOAL:
Generate an INTERACTIVE VISUAL SIMULATION that helps a student deeply understand the concept.

The simulation should:
1. Represent the concept visually (arrays, graphs, particles, flows, etc.)
2. Animate step-by-step transitions
3. Include clear narration for each step
4. Highlight active elements dynamically
5. Maintain logical flow (no chaotic visuals)

OUTPUT FORMAT (STRICT JSON):
{{
  "title": "Simulation Title",
  "concept_summary": "Short 2-3 line explanation of the core idea",
  "visual_structure": {{
    "type": "array | graph | flow | system | molecular | custom",
    "elements": [ ... ]
  }},
  "steps": [
    {{
      "step_title": "Step name",
      "narration": "What is happening in this step (detailed explanation)",
      "elements_to_highlight": ["id1", "id2"],
      "animation_type": "move | scale | fade | highlight"
    }}
  ],
  "controls": ["start", "pause", "next", "reset"],
  "domain": "DSA | Physics | Chemistry | Biology | Math | Engineering"
}}

Create 6-12 logical steps that clearly demonstrate the concept."""

SESSION_INSIGHTS_PROMPT = """You are an AI study coach like ChatGPT or Gemini. Analyze this student's study session and provide a professional, structured review.

Session Events:
{events}

Return ONLY valid JSON:
{{
  "learned": ["Point 1", "Point 2"],
  "doubts": ["Potential area for review 1"],
  "review": "A detailed, encouraging analysis of the user's performance, strengths, and areas to focus on next.",
  "recap": "A concise 1-2 sentence executive summary of the entire session."
}}"""


class AIService:
    """LLM orchestration using Groq (Llama 3) to generate study outputs."""

    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama-3.3-70b-versatile"

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

    def generate_simulation(self, text: str, material_id: str) -> Dict[str, Any]:
        """Generate a visual simulation from study text."""
        prompt = SIMULATION_PROMPT.format(text=text[:8000])
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

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
                    material_id=material_id,
                    label=node_data["label"],
                    topic=node_data.get("topic", ""),
                    description=node_data.get("description", ""),
                    video_timestamp=video_ts,
                    video_timestamp_label=video_ts_label,
                    node_type=node_data.get("node_type", "concept"),
                    color=node_data.get("color"),
                    graph_type="mindmap"
                )
            )

        edges = [
            MindMapEdge(
                id=e["id"],
                material_id=material_id,
                source=e["source"],
                target=e["target"],
                label=e.get("label"),
                graph_type="mindmap"
            )
            for e in data.get("edges", [])
        ]

        return MindMapGraph(material_id=material_id, nodes=nodes, edges=edges, graph_type="mindmap")

    async def generate_concept_graph(self, text: str, material_id: str) -> MindMapGraph:
        """Generate a bipartite concept graph from study text."""
        prompt = CONCEPT_GRAPH_PROMPT.format(text=text[:6000])
        raw = self._chat(prompt)
        data = self._safe_json_parse(raw)

        nodes = [
            MindMapNode(
                id=n["id"],
                material_id=material_id,
                label=n["label"],
                topic=n.get("topic", ""),
                description=n.get("description", ""),
                node_type=n.get("node_type", "concept"),
                graph_type="conceptgraph",
                color="#7C3AED" if n.get("node_type") == "concept" else "#F59E0B"
            )
            for n in data.get("nodes", [])
        ]
        edges = [
            MindMapEdge(
                id=e["id"],
                material_id=material_id,
                source=e["source"],
                target=e["target"],
                label=e.get("label"),
                graph_type="conceptgraph"
            )
            for e in data.get("edges", [])
        ]
        return MindMapGraph(material_id=material_id, nodes=nodes, edges=edges, graph_type="conceptgraph")

    async def generate_practical_challenge(self, text: str) -> Dict[str, Any]:
        """Generate a practical challenge/scenario from text."""
        prompt = PRACTICAL_EXERCISE_PROMPT.format(text=text[:6000])
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

    async def generate_session_insights(self, events: List[Dict]) -> Dict[str, Any]:
        """Synthesize session events into a study review."""
        if not events:
            return {
                "learned": ["Started a session"],
                "doubts": [],
                "review": "Not enough activity to generate a detailed review yet.",
                "recap": "A short introductory session."
            }
        
        # Simplify events for the prompt
        event_summary = [
            {"type": e.get("event_type"), "topic": e.get("topic"), "time": e.get("timestamp")}
            for e in events[:50]  # limit to 50 events
        ]
        prompt = SESSION_INSIGHTS_PROMPT.format(events=json.dumps(event_summary))
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

    async def evaluate_practical_answer(self, text: str, challenge: Any, answer: str, user_id: str = None) -> Dict[str, Any]:
        """Evaluate student response and update mastery state."""
        prompt = PRACTICAL_FEEDBACK_PROMPT.format(text=text[:6000], challenge=json.dumps(challenge), answer=answer)
        res = self._chat(prompt)
        
        # Simple qualitative to score mapping for mastery tracking
        score = 0.5
        if "excellent" in res.lower() or "perfect" in res.lower(): score = 0.95
        elif "good" in res.lower() or "correct" in res.lower(): score = 0.75
        elif "mistake" in res.lower() or "incorrect" in res.lower(): score = 0.3
        
        if user_id:
            try:
                from supabase import create_client
                import os
                supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
                
                topic = challenge.get('topic', 'General') if isinstance(challenge, dict) else 'General'
                supabase.table("user_knowledge_state").upsert({
                    "user_id": user_id,
                    "topic": topic,
                    "mastery_score": score,
                    "last_updated": "now()"
                }, on_conflict="user_id,topic").execute()
            except Exception as e:
                logger.error(f"Mastery upsert failed: {e}")

        return {"feedback": res, "score": score}

    async def process_material(
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
        concept_graph = await self.generate_concept_graph(text, material_id)

        return AIProcessingResult(
            material_id=material_id,
            flashcards=flashcards,
            exam_points=exam_points,
            mind_map=mind_map,
            concept_graph=concept_graph,
            processing_time_seconds=round(time.time() - start, 2),
            model_used=self.model,
        )
