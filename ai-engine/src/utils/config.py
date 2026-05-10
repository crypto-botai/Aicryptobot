from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    AI_ENGINE_API_KEY: Optional[str] = None

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://localhost/aicryptobot"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None

    # AI APIs
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None

    # News
    NEWS_API_KEY: Optional[str] = None

    # ML
    MODEL_CACHE_DIR: str = "/app/data/models"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
