import tempfile
import os
import logging
from typing import Dict, Any
from groq import Groq
from config import get_settings

logger = logging.getLogger(__name__)


class WhisperService:
    """Transcribes audio/video using Groq's Whisper API (cloud-based, lightweight)."""

    def __init__(self, model_size: str = "whisper-large-v3"):
        self.model_name = "whisper-large-v3"
        settings = get_settings()
        self._client = Groq(api_key=settings.groq_api_key)

    def transcribe_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe an audio/video file via Groq Whisper API.
        Returns dict with: text, language, segments
        """
        try:
            logger.info(f"Transcribing via Groq Whisper: {file_path}")
            with open(file_path, "rb") as audio_file:
                transcription = self._client.audio.transcriptions.create(
                    file=(os.path.basename(file_path), audio_file),
                    model=self.model_name,
                    response_format="verbose_json",
                )

            segments = []
            for i, seg in enumerate(getattr(transcription, "segments", []) or []):
                segments.append({
                    "id": i,
                    "start": seg.get("start", 0) if isinstance(seg, dict) else getattr(seg, "start", 0),
                    "end": seg.get("end", 0) if isinstance(seg, dict) else getattr(seg, "end", 0),
                    "text": (seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")).strip(),
                    "timestamp_label": self._format_timestamp(
                        seg.get("start", 0) if isinstance(seg, dict) else getattr(seg, "start", 0)
                    ),
                })

            return {
                "text": transcription.text,
                "language": getattr(transcription, "language", "en"),
                "segments": segments,
            }
        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}")
            return {"text": "", "language": "en", "segments": []}

    def transcribe_bytes(self, audio_bytes: bytes, suffix: str = ".mp4") -> Dict[str, Any]:
        """Transcribe from raw bytes by writing to a temp file."""
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            return self.transcribe_file(tmp_path)
        finally:
            os.unlink(tmp_path)

    @staticmethod
    def _format_timestamp(seconds: float) -> str:
        """Convert seconds to MM:SS or HH:MM:SS format."""
        total_seconds = int(seconds)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        return f"{minutes}:{secs:02d}"
