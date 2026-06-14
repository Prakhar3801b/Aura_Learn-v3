import logging
import httpx
from typing import List
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class EmbeddingService:
    """Service to generate vector embeddings using Hugging Face Serverless Inference API."""

    def __init__(self):
        self.model_id = "BAAI/bge-small-en-v1.5"
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        self.headers = {}
        if settings.hf_api_key:
            self.headers["Authorization"] = f"Bearer {settings.hf_api_key}"
        logger.info(f"Hugging Face Embedding Service initialized with model: {self.model_id}")

    def embed_texts(self, texts: List[str], input_type: str = "document") -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        """
        if not texts:
            return []

        try:
            response = httpx.post(
                self.api_url,
                headers=self.headers,
                json={"inputs": texts, "options": {"wait_for_model": True}},
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            
            # The API returns a list of floats (for a single string input) or list of lists.
            # When texts is a list, it usually returns a list of lists.
            # Let's ensure it is always List[List[float]]
            if isinstance(result, list):
                if len(result) > 0 and not isinstance(result[0], list):
                    return [result]
                return result
            else:
                raise ValueError(f"Unexpected response format from HF API: {result}")
                
        except Exception as e:
            logger.error(f"Hugging Face embedding API failed: {e}")
            raise

    def embed_query(self, query: str) -> List[float]:
        """Convenience method for embedding a single query."""
        prefixed_query = f"Represent this sentence for searching relevant passages: {query}"
        embeddings = self.embed_texts([prefixed_query], input_type="query")
        return embeddings[0] if embeddings else []

