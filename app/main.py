from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from mangum import Mangum

from app.api.router import create_api_router
from app.core.config import get_settings
from app.core.handlers import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.dependencies.providers import get_section_service, get_test_service

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

    # Cache-Control middleware for GET requests to optimize client & CDN response times
    @app.middleware("http")
    async def add_cache_control_header(request: Request, call_next):
        response = await call_next(request)
        if request.method == "GET" and response.status_code == 200:
            path = request.url.path
            if path in ("/health", "/") or path.startswith("/tests") or path.startswith("/question-sets"):
                response.headers["Cache-Control"] = "public, max-age=5, s-maxage=10, stale-while-revalidate=60"
        return response

    app.include_router(create_api_router())
    register_exception_handlers(app)
    return app


app = create_application()
mangum_handler = Mangum(app, api_gateway_base_path=None)


# Lambda Handler with instant warm ping intercept & global connection pre-warming
def handler(event, context):
    # Instant warm ping check (< 1ms)
    if isinstance(event, dict) and (
        event.get("source") in ("aws.events", "serverless-plugin-warmup")
        or event.get("action") == "ping"
        or event.get("detail-type") == "Scheduled Event"
    ):
        return {"statusCode": 200, "body": '{"status":"warm"}'}

    return mangum_handler(event, context)


# Pre-initialize boto3 DynamoDB tables at Lambda container INIT phase (free AWS CPU)
try:
    _test_svc = get_test_service()
    _sec_svc = get_section_service()
    # Warm table descriptors & TCP connection pool during INIT phase
    _test_svc.repository.table.table_status
    if _sec_svc and hasattr(_sec_svc.repository, "table"):
        _sec_svc.repository.table.table_status
except Exception as e:
    logger.debug("Container init pre-warm notice: %s", e)
