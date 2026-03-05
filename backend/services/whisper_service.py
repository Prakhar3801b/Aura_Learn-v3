import whisper
import tempfile
import os
import logging
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class WhisperService:
    """Transcribes audio/video using local OpenAI Whisper model."""

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None

    def _get_model(self):
        if self._model is None:
            logger.info(f"Loading Whisper model: {self.model_size}")
            self._model = whisper.load_model(self.model_size)
        return self._model

    def transcribe_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe an audio/video file and return transcript with timestamps.
        Returns dict with: text, segments (each with start, end, text)
        """
        try:
            model = self._get_model()
            logger.info(f"Transcribing: {file_path}")
            result = model.transcribe(file_path, word_timestamps=False, verbose=False)
            return {
                "text": result["text"],
                "language": result.get("language", "en"),
                "segments": [
                    {
                        "id": seg["id"],
                        "start": seg["start"],
                        "end": seg["end"],
                        "text": seg["text"].strip(),
                        "timestamp_label": self._format_timestamp(seg["start"]),
                    }
                    for seg in result.get("segments", [])
                ],
            }
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
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
