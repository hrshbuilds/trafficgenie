"""
Configuration management with validation for TrafficGenie backend.
Supports dev, staging, and production environments.
"""
import os
from typing import Literal, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    # App
    ENV: Literal["development", "staging", "production"] = "development"
    APP_NAME: str = "TrafficGenie"
    APP_VERSION: str = "1.2.0"
    DEBUG: bool = Field(default=False)

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_PREFIX: str = "/api"
    ALLOWED_ORIGINS: Union[str, list] = "*"  # CSV list or "*"

    # Database
    DATABASE_URL: str = "sqlite:///./trafficgenie.db"
    DB_ECHO: bool = False  # SQL query logging
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""
    FIREBASE_CREDENTIALS_JSON: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""

    # Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # File Storage
    UPLOAD_DIR: str = "data/uploads"
    OUTPUT_DIR: str = "data/output"
    MAX_UPLOAD_SIZE_MB: int = 500

    # Detection Models
    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    HELMET_MODEL_PATH: str = ""  # Optional specialized helmet model

    # Redis/Job Queue
    REDIS_URL: str = ""  # Leave empty to disable async jobs
    JOB_QUEUE_ENABLED: bool = False

    # Security
    JWT_SECRET: str = Field(default="dev-secret-key")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "text"

    # Feature Flags
    DEMO_MODE: bool = False
    ENABLE_REAL_TIME_UPDATES: bool = True
    ENABLE_GEMINI_INSIGHTS: bool = True

    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse CSV origins into list."""
        if isinstance(v, str):
            if v == "*":
                return "*"
            return [origin.strip() for origin in v.split(",")]
        return v

    def get_database_settings(self):
        """Get database configuration dict."""
        connect_args = {}
        if self.DATABASE_URL.startswith("sqlite"):
            connect_args = {"check_same_thread": False}

        return {
            "url": self.DATABASE_URL,
            "echo": self.DEBUG and self.DB_ECHO,
            "future": True,
            "pool_pre_ping": True,
            "connect_args": connect_args,
            "pool_size": self.DB_POOL_SIZE,
            "max_overflow": self.DB_MAX_OVERFLOW,
        }

    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENV == "production"

    def is_development(self) -> bool:
        """Check if running in development."""
        return self.ENV == "development"


# Global settings instance
settings = Settings()

# Validate critical configuration
if not settings.is_development():
    if settings.DEMO_MODE:
        raise ValueError("DEMO_MODE cannot be True in non-development environment")
    if "*" in str(settings.ALLOWED_ORIGINS):
        raise ValueError("ALLOWED_ORIGINS cannot be '*' in production")
    if settings.DATABASE_URL.startswith("sqlite"):
        raise ValueError("SQLite database not allowed in production")
