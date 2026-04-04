import logging
import httpx
import re
from typing import Optional, Dict, Any
from langchain_community.document_loaders import WebBaseLoader
from services.whisper_service import WhisperService

logger = logging.getLogger(__name__)

class URLProcessingService:
    """Service to extract content from web links (YouTube, articles, etc.)."""
    
    def __init__(self):
        self.whisper_service = WhisperService()

    async def process_url(self, url: str) -> Dict[str, Any]:
        """Detect URL type and extract text content."""
        url = url.strip()
        
        # 1. YouTube Detection
        if any(x in url for x in ["youtube.com", "youtu.be"]):
            return await self._process_youtube(url)
            
        # 2. General Web Scraping
        return await self._process_generic_web(url)

    async def _process_youtube(self, url: str) -> Dict[str, Any]:
        """Extract transcript or metadata from YouTube."""
        # Note: In a real production environment, you'd use youtube-transcript-api 
        # or a similar library. For now, we'll simulate the extraction.
        # If we can't get a transcript, we'll try to find any descriptive text.
        logger.info(f"Processing YouTube URL: {url}")
        
        # Placeholder for transcript extraction logic
        # For now, return a mockup or try to scrape the title/description
        try:
            loader = WebBaseLoader(url)
            docs = loader.load()
            text = " ".join([d.page_content for d in docs])
            return {
                "text": text,
                "file_type": "video",
                "title": "YouTube Video Content"
            }
        except Exception as e:
            logger.error(f"YouTube processing failed: {e}")
            raise

    async def _process_generic_web(self, url: str) -> Dict[str, Any]:
        """Extract text from a generic webpage."""
        logger.info(f"Processing Generic Web URL: {url}")
        try:
            loader = WebBaseLoader(url)
            docs = loader.load()
            text = " ".join([d.page_content for d in docs])
            
            # Simple title extraction
            title = "Web Article"
            if docs and "title" in docs[0].metadata:
                title = docs[0].metadata["title"]
            
            return {
                "text": text,
                "file_type": "pdf", # Treat as text/pdf for output purposes
                "title": title
            }
        except Exception as e:
            logger.error(f"Web scraping failed: {e}")
            raise
