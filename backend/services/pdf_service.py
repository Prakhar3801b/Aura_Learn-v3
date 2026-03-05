import pdfplumber
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class PDFService:
    """Extracts and chunks text from PDF files."""

    def extract_text(self, file_path: str) -> str:
        """Extract all text from a PDF file."""
        full_text = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        full_text.append(text)
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return ""

    def extract_text_from_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes."""
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        try:
            return self.extract_text(tmp_path)
        finally:
            os.unlink(tmp_path)

    def chunk_text(
        self, text: str, chunk_size: int = 1000, overlap: int = 200
    ) -> List[Dict]:
        """Split text into overlapping chunks for vector embedding."""
        if not text:
            return []
        chunks = []
        start = 0
        chunk_id = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "char_start": start,
                "char_end": end,
            })
            chunk_id += 1
            start = end - overlap
        return chunks
