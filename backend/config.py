from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Groq
    groq_api_key: str = ""

    # Voyage AI (for embeddings)
    voyage_api_key: str = ""

    # App
    secret_key: str = "change-this-in-production-supersecretkey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Upload limits
    max_upload_size_mb: int = 500

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
