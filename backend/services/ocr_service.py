import pytesseract
from PIL import Image
import base64
import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class OCRService:
    """Extracts text from images using Tesseract OCR."""

    def __init__(self):
        # Try to find tesseract, common Windows path
        tesseract_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for path in tesseract_paths:
            if Path(path).exists():
                pytesseract.pytesseract.tesseract_cmd = path
                break

    def extract_from_image_bytes(self, image_bytes: bytes) -> str:
        """Extract text from image bytes."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to RGB if needed
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            text = pytesseract.image_to_string(image, lang="eng")
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""

    def extract_from_file(self, file_path: str) -> str:
        """Extract text from an image file."""
        try:
            image = Image.open(file_path)
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            text = pytesseract.image_to_string(image, lang="eng")
            return text.strip()
        except Exception as e:
            logger.error(f"OCR file extraction failed: {e}")
            return ""

    def is_available(self) -> bool:
        """Check if Tesseract is available."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False
