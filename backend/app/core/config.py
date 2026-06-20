"""Application configuration, loaded from environment variables / .env.

Centralises every tunable so nothing is hard-coded in the codebase.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_name: str = "City Clinic API"
    app_version: str = "2.0.0"
    debug: bool = True

    # Database (SQLite by default, PostgreSQL via DATABASE_URL).
    database_url: str = "sqlite:///./clinic.db"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Rate limiting (fixed window, per client IP).
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 200
    rate_limit_window_seconds: int = 60

    # Caching
    analytics_cache_ttl: int = 15  # seconds

    # Auth / JWT
    secret_key: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8 hours


settings = Settings()
