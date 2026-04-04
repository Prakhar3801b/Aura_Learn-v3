import logging
from datetime import datetime, timedelta
from typing import List, Optional
from models.analytics import SessionEvent, AnomalyFlag, StudySession
from services.reward_service import RewardService

logger = logging.getLogger(__name__)

# Thresholds for anomaly detection
WRONG_ANSWER_THRESHOLD = 3   # consecutive wrong answers signals struggle
PAUSE_THRESHOLD_SECONDS = 30  # long pause on same topic signals confusion
REREAD_THRESHOLD = 4          # re-reading same content multiple times


class AnalyticsService:
    """
    Real-time study session analytics with anomaly detection.
    Monitors comprehension drops and triggers adaptive interventions.
    """

    def __init__(self):
        # In-memory store for active session state (in prod, use Redis/Supabase)
        self._session_cache: dict = {}
        self.reward_service = RewardService()

    def record_event(self, event: SessionEvent) -> Optional[AnomalyFlag]:
        """
        Record a study event and check for comprehension anomalies.
        Returns an AnomalyFlag if an issue is detected, else None.
        """
        sid = event.session_id
        if sid not in self._session_cache:
            self._session_cache[sid] = {
                "events": [],
                "wrong_streak": 0,
                "topic_pauses": {},
                "topic_reads": {},
                "comprehension_score": 1.0,
            }

        state = self._session_cache[sid]
        state["events"].append(event)

        anomaly = None

        if event.event_type == "wrong_answer":
            state["wrong_streak"] += 1
            if state["wrong_streak"] >= WRONG_ANSWER_THRESHOLD:
                anomaly = self._create_anomaly(
                    event, "repeated_errors",
                    f"Student answered {state['wrong_streak']} questions wrong on '{event.topic}'",
                    "simplify_content",
                )
                state["wrong_streak"] = 0
            state["comprehension_score"] = max(0.1, state["comprehension_score"] - 0.1)

        elif event.event_type == "correct_answer":
            state["wrong_streak"] = 0
            state["comprehension_score"] = min(1.0, state["comprehension_score"] + 0.05)

        elif event.event_type == "pause":
            topic = event.topic or "unknown"
            state["topic_pauses"][topic] = state["topic_pauses"].get(topic, 0) + 1
            if state["topic_pauses"][topic] >= 3:
                anomaly = self._create_anomaly(
                    event, "stuck_on_topic",
                    f"Student has paused {state['topic_pauses'][topic]}x on '{topic}'",
                    "suggest_ar_lab",
                )
                state["comprehension_score"] = max(0.1, state["comprehension_score"] - 0.15)

        elif event.event_type == "re-read":
            topic = event.topic or "unknown"
            state["topic_reads"][topic] = state["topic_reads"].get(topic, 0) + 1
            if state["topic_reads"][topic] >= REREAD_THRESHOLD:
                anomaly = self._create_anomaly(
                    event, "comprehension_drop",
                    f"Student re-read '{topic}' {state['topic_reads'][topic]} times",
                    "add_flashcard",
                )

        return anomaly

    def get_comprehension_score(self, session_id: str) -> float:
        state = self._session_cache.get(session_id, {})
        return state.get("comprehension_score", 1.0)

    def get_session_summary(self, session_id: str, user_id: str = None) -> dict:
        state = self._session_cache.get(session_id, {})
        score = state.get("comprehension_score", 1.0)
        
        # Trigger reward logic on session end (when summary is fetched)
        if user_id:
            try:
                self.reward_service.update_streak(user_id)
                self.reward_service.update_understandings(user_id, score)
            except Exception as e:
                logger.error(f"Reward update failed: {e}")

        return {
            "events_count": len(state.get("events", [])),
            "comprehension_score": score,
            "stuck_topics": [
                t for t, c in state.get("topic_pauses", {}).items() if c >= 3
            ],
        }

    @staticmethod
    def _create_anomaly(
        event: SessionEvent,
        anomaly_type: str,
        description: str,
        intervention: str,
    ) -> AnomalyFlag:
        logger.warning(f"Anomaly detected: {anomaly_type} — {description}")
        return AnomalyFlag(
            session_id=event.session_id,
            material_id=event.material_id,
            anomaly_type=anomaly_type,
            detected_at=datetime.utcnow(),
            topic=event.topic,
            intervention=intervention,
        )
