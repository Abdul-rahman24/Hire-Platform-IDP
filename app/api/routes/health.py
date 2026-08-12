from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/", summary="Root endpoint")
async def root() -> dict[str, str]:
    settings = get_settings()
    return {
        "message": f"{settings.app_name} is running",
        "swagger_url": "/docs",
        "openapi_url": "/openapi.json",
        "redoc_url": "/redoc",
    }


@router.get("/swagger", include_in_schema=False)
async def swagger_redirect() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
    )
