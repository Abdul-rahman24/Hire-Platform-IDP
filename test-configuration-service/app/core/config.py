from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Test Configuration Service", alias="APP_NAME")
    app_env: Literal["local", "development", "staging", "production"] = Field(
        default="local",
        alias="APP_ENV",
    )
    app_debug: bool = Field(default=False, alias="APP_DEBUG")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_log_level: str = Field(default="INFO", alias="APP_LOG_LEVEL")
    app_cors_origins: list[str] = Field(default=["*"], alias="APP_CORS_ORIGINS")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    aws_region: str = Field(default="ap-south-1", alias="AWS_REGION")
    dynamodb_endpoint_url: str | None = Field(default=None, alias="DYNAMODB_ENDPOINT_URL")
    dynamodb_table_prefix: str = Field(default="test-config", alias="DYNAMODB_TABLE_PREFIX")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

