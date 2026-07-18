"""
Application configuration using pydantic-settings.
All settings are loaded from environment variables or .env file.
"""
import logging as _logging
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_config_logger = _logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Donation Management System"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"

    # Database
    database_url: str = "postgresql://postgres:123456@localhost:5432/donation_db"
    db_echo: bool = False

    # JWT
    secret_key: str = "change-this-secret-key-in-production-min-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # File Storage
    media_path: str = "./media"
    max_upload_size_mb: int = 10

    # AI Detection
    detection_confidence: float = 0.40
    model_path: str = "./models/best.pt"
    use_mock_detector: bool = True

    # Matching Engine
    match_score_threshold: float = 0.50
    match_top_n: int = 3
    match_expiry_hours: int = 48

    def model_post_init(self, __context) -> None:
        """Warn on dangerous production config."""
        if self.environment == "production" and "*" in self.allowed_origins:
            _config_logger.warning(
                "SECURITY WARNING: ALLOWED_ORIGINS contains '*' in production environment. "
                "Set explicit frontend origins instead."
            )
        if self.secret_key == "change-this-secret-key-in-production-min-32-chars":
            _config_logger.warning(
                "SECURITY WARNING: SECRET_KEY is set to the default placeholder value. "
                "Generate a strong secret key before deploying to production."
            )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use this as a FastAPI dependency: Depends(get_settings)
    lru_cache ensures the .env file is read only once.
    """
    return Settings()


# Module-level settings instance for non-dependency use
settings = get_settings()
