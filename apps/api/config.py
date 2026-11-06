from pydantic_settings import BaseSettings
from typing import Literal, Optional
from pathlib import Path

class Settings(BaseSettings):
    DATA_MODE: Literal["demo", "real"] = "demo"
    API_PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./data/ev_gap.db"
    ROUTING_PROVIDER: Literal["osrm", "approximate"] = "approximate"
    OSRM_URL: str = "http://localhost:5000"
    JWT_SECRET: str = "demo-secret-key-change-in-production-123456789"
    CITY_DEFAULT: str = "vizag"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
