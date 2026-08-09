from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from mangum import Mangum

from app.api.router import create_api_router
from app.core.config import get_settings
from app.core.handlers import register_exception_handlers
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    logger.info("Starting %s in %s mode", settings.app_name, settings.app_env)
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_application() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.app_debug,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.app_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Enable GZip response compression for payloads > 500 bytes
    app.add_middleware(GZipMiddleware, minimum_size=500)

    app.include_router(create_api_router())
    register_exception_handlers(app)
    return app


app = create_application()
handler = Mangum(app)
