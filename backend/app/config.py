from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    tick_rate_hz: float = 30.0
    db_url: str = "sqlite+aiosqlite:///./circuits.db"
    max_fixpoint_iterations: int = 16
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
