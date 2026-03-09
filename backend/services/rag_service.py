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

    async def answer_question(self, material_id: str, question: str) -> Dict[str, Any]:
        """
        1. Embed the question.
        2. Search for relevant context in Supabase.
        3. Generate answer using Groq Llama 3.3.
        """
        try:
            # 1. Generate query embedding
            query_vector = self.embedding_service.embed_query(question)
            
            # 2. Search vector store via RPC
            # search_material_chunks is defined in migration 002
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
                context_text = "No specific context found in the study material for this question."

            # 3. Build RAG prompt
            prompt = f"""You are an expert study assistant for Aura Learn. Use the provided context from the study material to answer the student's question accurately.

If the answer isn't in the context, be honest but try to use general knowledge related to the material if appropriate, while noting that the specific information wasn't found in the text.

---
STUDY MATERIAL CONTEXT:
{context_text}
---

STUDENT QUESTION: {question}

Helpful, detailed answer:"""

            # 4. Get LLM response
            answer = self.ai_service._chat(prompt)

            return {
                "answer": answer,
                "sources": [
                    {"chunk_index": c["chunk_index"], "similarity": c["similarity"]} 
                    for c in context_chunks
                ]
            }
            
        except Exception as e:
            logger.error(f"RAG answer generation failed: {e}")
            raise
