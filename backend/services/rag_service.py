import logging
from typing import List, Dict, Any
from supabase import create_client
from config import get_settings
from services.embedding_service import EmbeddingService
from services.ai_service import AIService

logger = logging.getLogger(__name__)
settings = get_settings()

class RAGService:
    """Orchestrates Retrieval-Augmented Generation for study materials."""

    def __init__(self):
        self.supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        self.embedding_service = EmbeddingService()
        self.ai_service = AIService()

    async def get_material_text(self, material_id: str) -> str:
        """Fetch all text chunks for a material to provide full context."""
        try:
            res = self.supabase.table("material_chunks").select("text").eq("material_id", material_id).order("chunk_index").execute()
            chunks = res.data or []
            return "\n".join([c["text"] for c in chunks])
        except Exception as e:
            logger.error(f"Failed to fetch material text: {e}")
            return ""

    async def answer_question(self, material_id: Any, question: str, user_id: str = None) -> Dict[str, Any]:
        """
        1. Fetch user knowledge context (if user_id provided).
        2. Embed the question.
        3. Search for context (single or multi-material).
        4. Generate personalized answer.
        """
        try:
            # 1. Fetch user knowledge context
            user_context = ""
            if user_id:
                state_res = self.supabase.table("user_knowledge_state").select("*").eq("user_id", user_id).execute()
                states = state_res.data or []
                if states:
                    weak_topics = [s["topic"] for s in states if s["mastery_score"] < 0.5]
                    if weak_topics:
                        user_context = f"NOTE: The student currently struggles with these topics: {', '.join(weak_topics)}. Explain concepts related to these very clearly and simply."

            # 2. Generate query embedding
            query_vector = self.embedding_service.embed_query(question)
            
            # 3. Search vector store
            if isinstance(material_id, list):
                # Use multi-material search
                rpc_res = self.supabase.rpc(
                    "search_multi_material_chunks",
                    {
                        "query_embedding": query_vector,
                        "match_material_ids": material_id,
                        "match_count": 8
                    }
                ).execute()
            else:
                # Use single material search
                rpc_res = self.supabase.rpc(
                    "search_material_chunks",
                    {
                        "query_embedding": query_vector,
                        "match_material_id": material_id,
                        "match_count": 5
                    }
                ).execute()
            
            context_chunks = rpc_res.data or []
            context_text = "\n\n---\n\n".join([c["text"] for c in context_chunks])
            
            if not context_text:
                context_text = "No specific context found in the study material(s) for this question."

            # 4. Build RAG prompt with PERSONALIZATION
            prompt = f"""You are Aura, an elite AI study companion. Your goal is to provide perfectly structured, clear, and insightful answers.

{user_context}

---
STUDY MATERIAL CONTEXT:
{context_text}
---

STUDENT QUESTION: {question}

INSTRUCTIONS:
1. **Formatting**: Use high-quality professional Markdown. Use `###` for sub-headers. Use **bolding** for emphasis.
2. **Structure**: Start with a concise direct answer in one sentence.
3. **Hierarchy**: Use bullet points or numbered lists for all complex explanations. 
4. **Spacing**: Use DOUBLE NEWLINES between every paragraph and major point to ensure the UI has room to breathe. Avoid congested blocks of text.
5. **Tone**: Be helpful, insightful, and elite. If a concept is complex, use an analogy or step-by-step breakdown.
6. **Constraint**: If the context doesn't have the answer, use your general knowledge but mention it's based on general principles.

Answer:"""

            # 5. Get LLM response
            answer = self.ai_service._chat(prompt)

            return {
                "answer": answer,
                "sources": [
                    {"material_id": c["material_id"], "chunk_index": c["chunk_index"], "similarity": c["similarity"]} 
                    for c in context_chunks
                ]
            }
            
        except Exception as e:
            logger.error(f"RAG answer generation failed: {e}")
            raise
