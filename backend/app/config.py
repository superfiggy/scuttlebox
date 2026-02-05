"""Application configuration."""

from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings

# Find project root (parent of backend/)
PROJECT_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    # OpenClaw Gateway
    openclaw_gateway_url: str = "http://localhost:18789"
    openclaw_gateway_token: str = ""
    openclaw_workspace: str = str(Path.home() / ".openclaw" / "workspace")
    
    # Server
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
    }


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
