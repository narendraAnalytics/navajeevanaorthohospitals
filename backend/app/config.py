from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    GROQ_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    NEON_DB_URL: str = ""
    CHROMA_MODE: str = "local"
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    ALLOWED_ORIGIN: str = "http://localhost:3000"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""
    RESEND_FROM_NAME: str = "Navajeevana Ortho Hospitals"


settings = Settings()
