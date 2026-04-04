import logging
from datetime import datetime, date, timedelta
from typing import List, Optional
from supabase import create_client
from config import get_settings
from models.rewards import UserRewards, Badge
from services.mail_service import MailService

logger = logging.getLogger(__name__)
settings = get_settings()

class RewardService:
    """Service to handle user streaks, badges, and understanding metrics."""
    
    def __init__(self):
        self.supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        self.mail_service = MailService()

    def get_user_rewards(self, user_id: str) -> UserRewards:
        """Fetch or initialize user rewards from Supabase."""
        res = self.supabase.table("user_rewards").select("*").eq("user_id", user_id).execute()
        if not res.data:
            new_rewards = {
                "user_id": user_id,
                "streak_count": 0,
                "last_study_date": None,
                "badges": [],
                "understandings_score": 0.0,
            }
            self.supabase.table("user_rewards").insert(new_rewards).execute()
            return UserRewards(**new_rewards)
        
        return UserRewards(**res.data[0])

    def update_streak(self, user_id: str):
        """Update daily streak based on study activity."""
        rewards = self.get_user_rewards(user_id)
        today = date.today()
        
        if rewards.last_study_date == today:
            return  # Already studied today
            
        if rewards.last_study_date == today - timedelta(days=1):
            rewards.streak_count += 1
        elif rewards.last_study_date is None or rewards.last_study_date < today - timedelta(days=1):
            rewards.streak_count = 1  # Reset or start new
            
        rewards.last_study_date = today
        
        self.supabase.table("user_rewards").update({
            "streak_count": rewards.streak_count,
            "last_study_date": today.isoformat(),
        }).eq("user_id", user_id).execute()
        
        # Check for milestone badges (e.g., 7-day streak)
        if rewards.streak_count == 7:
            self.award_badge(user_id, "warrior_7", "7-Day Warrior", "Studied for 7 days in a row!", "🔥")

    def award_badge(self, user_id: str, badge_id: str, title: str, description: str, icon: str):
        """Award a badge to a user and send an email."""
        rewards = self.get_user_rewards(user_id)
        
        # Check if already awarded
        if any(b.id == badge_id for b in rewards.badges):
            return

        new_badge = Badge(
            id=badge_id,
            title=title,
            description=description,
            icon=icon,
            awarded_at=datetime.utcnow()
        )
        
        badges = [b.dict() for b in rewards.badges] + [new_badge.dict()]
        
        self.supabase.table("user_rewards").update({
            "badges": badges
        }).eq("user_id", user_id).execute()
        
        # Notify user
        try:
            user_res = self.supabase.auth.admin.get_user_by_id(user_id) # Requires service role
            email = user_res.user.email
            if email:
                self.mail_service.send_milestone_email(email, title)
        except Exception as e:
            logger.error(f"Failed to fetch user email for notification: {e}")

    def update_understandings(self, user_id: str, session_score: float):
        """Update the aggregate understanding score."""
        rewards = self.get_user_rewards(user_id)
        # Simple moving average for demonstration
        new_score = (rewards.understandings_score * 0.7) + (session_score * 0.3)
        
        self.supabase.table("user_rewards").update({
            "understandings_score": round(new_score, 2)
        }).eq("user_id", user_id).execute()
        
        if new_score > 0.9:
            self.award_badge(user_id, "master_mind", "Master Mind", "Aura detected deep mastery across complex topics.", "🧠")
