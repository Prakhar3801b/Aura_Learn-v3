from fastapi import APIRouter, HTTPException
from services.reward_service import RewardService
from models.rewards import UserRewards

router = APIRouter(prefix="/rewards", tags=["Rewards"])
reward_service = RewardService()

@router.get("/{user_id}", response_model=UserRewards)
async def get_user_rewards(user_id: str):
    try:
        return reward_service.get_user_rewards(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/reminder")
async def send_streak_reminder(user_id: str):
    """Triggered by a cron job or background task to remind user."""
    try:
        rewards = reward_service.get_user_rewards(user_id)
        # In a real app, we'd fetch the user's email via admin auth or a users table
        # reward_service.mail_service.send_streak_reminder(email, rewards.streak_count)
        return {"sent": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
