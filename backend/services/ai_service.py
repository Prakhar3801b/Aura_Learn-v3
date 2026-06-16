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

**CRITICAL**: Ignore all navigational links, footer content, social media references (e.g., "Follow us on YouTube"), and other non-educational noise in the input text. Focus ONLY on the core educational content.

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

**CRITICAL**: Ignore all navigational links, footer content, social media references, and other non-educational noise. Focus ONLY on core academic facts.

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

**CRITICAL**: Ignore all navigational links, footer content, social media references, and other non-educational noise. Focus ONLY on the structure of the educational content.

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
SIMULATION_PROMPT = """You are an advanced simulation planning engine for an AI-powered learning platform.
Your job is to convert study material into a structured simulation plan that can be rendered by a frontend system.

You DO NOT generate UI code.
You ONLY generate structured simulation data in valid JSON.

----------------------------------------

INPUT:
Study Content: {text}
Optional Focus Topic: {material_id}

----------------------------------------

STEP 1: DOMAIN DETECTION
Identify the domain: DSA, Physics, Chemistry, Biology, Engineering, Math, Medical, or General Systems.

STEP 2: SIMULATION TYPE SELECTION
Choose the BEST simulation type:
- array → indexed data, linear sequences, algorithms
- flow → pipelines, processes, transformations, data movement
- graph → networks, trees, complex relationships
- system → interacting high-level components/modules
- molecular → particles, biological/chemical microscopic interactions

STEP 3: STRUCTURE DESIGN
Define:
1. COMPONENTS: Core static units (nodes, containers, modules). Use logical {{x, y}} coordinates (0-800 range).
2. ENTITIES: Dynamic elements that move or change (data packets, signals, molecules).
3. CONNECTIONS: Define directional relationships (from -> to).

STEP 4: STEP-BY-STEP SIMULATION
Create 6–10 steps. Each step MUST include at least one movement or transformation.

STEP 5: ANIMATION DESIGN
Each step must include an "animations" array:
{{
  "type": "move | highlight | transform | scale | rotate | pulse",
  "target": "entity_id or component_id",
  "from": "component_id (for move)",
  "to": "component_id (for move)",
  "duration": 1.0–2.0,
  "style": {{ "glow": true, "trail": true, "color": "#hex" }}
}}

STEP 6: SPATIAL DESIGN
- Use clean layout (left→right or top→bottom flow).
- Keep 4–8 components max.
- Components should have enough space for entities to move between them.

----------------------------------------

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "title": "Simulation Title",
  "concept_summary": "Explanation of the core idea",
  "domain": "Detected domain",
  "simulation_type": "array | flow | graph | system | molecular",
  "components": [
    {{ "id": "comp1", "label": "Name", "type": "node", "position": {{ "x": 100, "y": 200 }}, "style": {{ "color": "blue" }} }}
  ],
  "connections": [
    {{ "from": "comp1", "to": "comp2", "label": "flow direction" }}
  ],
  "entities": [
    {{ "id": "ent1", "type": "data | signal | particle", "label": "Data", "current_position": "comp1" }}
  ],
  "steps": [
    {{
      "step": 1,
      "step_title": "Step name",
      "narration": "What is happening in this step",
      "animations": [
        {{ "type": "move", "target": "ent1", "from": "comp1", "to": "comp2", "duration": 1.5 }}
      ]
    }}
  ],
  "controls": ["start", "pause", "next", "reset"]
}}

----------------------------------------

IMPORTANT RULES:
- IMPORTANT: Use smooth transitions, glow/highlight effects, and motion trails in style hints.
- Output ONLY valid JSON.
- No UI code.
- Ensure technical accuracy for the domain.
"""

PRACTICAL_FEEDBACK_PROMPT = """You are an expert tutor evaluating a student's response to a practical challenge.
Compare the student's answer against the study material and the original challenge.

Study Material:
{text}

Challenge:
{challenge}

Student's Answer:
{answer}

Provide constructive, detailed feedback. Start by stating if the answer is "Excellent", "Good", or "Needs Improvement", then explain why, highlighting what was missed or correctly identified."""


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


QUIZ_PROMPT = """You are an expert tutor. Create a 5-question multiple-choice quiz based on this study material to test active recall.
For each question, provide 4 options and the correct answer.

Study Material:
{text}

Return ONLY valid JSON:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "...",
    "explanation": "..."
  }}
]"""

GLOSSARY_PROMPT = """Extract the top 10-15 key technical terms and their definitions from this study material.

Study Material:
{text}

Return ONLY valid JSON:
[
  {{
    "term": "...",
    "definition": "..."
  }}
]"""

RESOURCES_PROMPT = """Based on these study notes, suggest high-quality external learning resources.
Provide exactly:
- 3 YouTube video titles and search queries.
- 2 GeeksforGeeks or W3Schools article titles.
- 1 ResearchGate or Google Scholar paper topic.

Study Material Summary:
{text}

Return ONLY valid JSON:
{{
  "youtube": [{{ "title": "...", "query": "..." }}],
  "articles": [{{ "site": "GFG|W3Schools", "title": "...", "url_hint": "..." }}],
  "academic": [{{ "title": "...", "query": "..." }}]
}}"""


class AIService:
    """LLM orchestration using Groq (Llama 3) to generate study outputs."""

    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model or "llama-3.3-70b-versatile"
        self.fallback_model = settings.groq_fallback_model or "llama-3.1-8b-instant"

    def _chat(self, prompt: str, max_tokens: int = 4096) -> str:
        """Call Groq chat completion with automatic rate-limit fallback."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # Check for Rate Limit (HTTP 429 or rate_limit message)
            is_429 = False
            if hasattr(e, "status_code") and e.status_code == 429:
                is_429 = True
            elif "rate_limit" in str(e).lower() or "429" in str(e):
                is_429 = True

            if is_429 and self.model != self.fallback_model:
                logger.warning(f"Groq rate limit reached for {self.model}. Retrying with fallback model {self.fallback_model}...")
                try:
                    response = self.client.chat.completions.create(
                        model=self.fallback_model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=max_tokens,
                        temperature=0.3,
                    )
                    return response.choices[0].message.content.strip()
                except Exception as fallback_err:
                    logger.error(f"Fallback model {self.fallback_model} also failed: {fallback_err}")
            
            logger.error(f"Groq API call failed: {e}")
            raise

    def generate_simulation(self, text: str, material_id: str) -> Dict[str, Any]:
        """Generate a visual simulation from study text."""
        prompt = SIMULATION_PROMPT.format(text=text[:8000], material_id=material_id)
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

    async def generate_quiz(self, text: str) -> List[Dict]:
        """Generate an active recall quiz."""
        prompt = QUIZ_PROMPT.format(text=text[:6000])
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

    async def generate_glossary(self, text: str) -> List[Dict]:
        """Generate a glossary of key terms."""
        prompt = GLOSSARY_PROMPT.format(text=text[:6000])
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

    async def suggest_resources(self, text: str) -> Dict[str, Any]:
        """Suggest external YouTube and web resources."""
        prompt = RESOURCES_PROMPT.format(text=text[:4000])
        raw = self._chat(prompt)
        return self._safe_json_parse(raw)

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
