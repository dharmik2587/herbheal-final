from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./herbheal.db"
    FIREBASE_PROJECT_ID: str = ""   # For token verification
    REDIS_URL: str = ""             # Not used yet
    RATE_LIMIT_AI_PER_MIN: int = 8
    RATE_LIMIT_GENERAL_PER_MIN: int = 60
    MODEL_NAME: str = "gemini-2.0-flash"
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
