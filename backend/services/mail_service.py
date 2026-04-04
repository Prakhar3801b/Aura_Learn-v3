import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class MailService:
    """Simple mail service for sending notifications and reminders."""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"  # Default to Gmail for example
        self.smtp_port = 587
        self.user = "notifications@aura-learn.app" # Placeholder
        self.password = "placeholder-pass"
        self.enabled = False # Default disabled until config is provided

    def send_email(self, to_email: str, subject: str, body: str):
        if not self.enabled:
            logger.info(f"Mail service disabled. Would have sent '{subject}' to {to_email}")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = self.user
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.user, self.password)
            server.send_message(msg)
            server.quit()
            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")

    def send_milestone_email(self, to_email: str, milestone_name: str):
        subject = f"✨ Milestone Achieved: {milestone_name}!"
        body = f"<h2>Congratulations!</h2><p>You've just unlocked the <b>{milestone_name}</b> badge on Aura Learn. Keep up the great work!</p>"
        self.send_email(to_email, subject, body)

    def send_streak_reminder(self, to_email: str, streak_count: int):
        subject = "🔥 Your streak is in danger!"
        body = f"<h2>Don't let it go!</h2><p>Your {streak_count}-day streak is about to be broken. Spend just 5 minutes today to keep it alive!</p>"
        self.send_email(to_email, subject, body)
