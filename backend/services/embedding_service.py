import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service to generate vector embeddings using local sentence-transformers."""

    def __init__(self):
        logger.info("Initializing local SentenceTransformer model (all-MiniLM-L6-v2)...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("SentenceTransformer initialized successfully.")

    def embed_texts(self, texts: List[str], input_type: str = "document") -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        """
        try:
            if not texts:
                return []
            
            # encode() returns a numpy array by default; tolist() converts it to python floats
            embeddings = self.model.encode(texts).tolist()
            return embeddings
        except Exception as e:
            logger.error(f"Local embedding failed: {e}")
            raise

    def embed_query(self, query: str) -> List[float]:
        """Convenience method for embedding a single query."""
        embeddings = self.embed_texts([query], input_type="query")
        return embeddings[0] if embeddings else []
