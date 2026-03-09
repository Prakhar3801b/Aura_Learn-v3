import voyageai
import logging
from typing import List
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class EmbeddingService:
    """Service to generate vector embeddings using Voyage AI."""

    def __init__(self):
        self.client = voyageai.Client(api_key=settings.voyage_api_key)
        self.model = "voyage-3"

    def embed_texts(self, texts: List[str], input_type: str = "document") -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        input_type: "document" for storage, "query" for search.
        """
        try:
            if not texts:
                return []
            
            # Voyage 3 handles batching, but we should be mindful of limits
            result = self.client.embed(
                texts, 
                model=self.model, 
                input_type=input_type
            )
            return result.embeddings
        except Exception as e:
            logger.error(f"Voyage AI embedding failed: {e}")
            raise

    def embed_query(self, query: str) -> List[float]:
        """Convenience method for embedding a single query."""
        embeddings = self.embed_texts([query], input_type="query")
        return embeddings[0] if embeddings else []
