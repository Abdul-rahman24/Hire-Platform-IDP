from contextlib import asynccontextmanager
import os

import boto3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    logger.info(
        "AWS startup diagnostics: AWS_REGION=%s AWS_DEFAULT_REGION=%s "
        "DYNAMODB_ENDPOINT_URL=%s AWS_PROFILE=%s resolved_tables=%s",
        os.environ.get("AWS_REGION"),
        os.environ.get("AWS_DEFAULT_REGION"),
        settings.dynamodb_endpoint_url,
        os.environ.get("AWS_PROFILE"),
        {
            "assignments": f"{settings.dynamodb_table_prefix}-assignments",
            "exam-sessions": f"{settings.dynamodb_table_prefix}-exam-sessions",
            "tests": f"{settings.dynamodb_table_prefix}-tests",
            "sections": f"{settings.dynamodb_table_prefix}-sections",
            "section-question-mapping": (
                f"{settings.dynamodb_table_prefix}-section-question-mapping"
            ),
            "published-tests": f"{settings.dynamodb_table_prefix}-published-tests",
        },
    )
    _log_aws_identity(settings.aws_region)
    yield
    logger.info("Shutting down %s", settings.app_name)


def _log_aws_identity(region_name: str) -> None:
    session = boto3.Session()
    credentials = session.get_credentials()
    logger.info(
        "AWS boto3 session diagnostics: configured_region=%s session_region=%s "
        "credentials_source=%s profile=%s",
        region_name,
        session.region_name,
        credentials.method if credentials else None,
        session.profile_name,
    )
    try:
        identity = boto3.client("sts", region_name=region_name).get_caller_identity()
    except Exception:
        logger.exception("AWS STS GetCallerIdentity failed during startup diagnostics")
        return
    logger.info(
        "AWS STS identity: account=%s arn=%s user_id=%s",
        identity.get("Account"),
        identity.get("Arn"),
        identity.get("UserId"),
    )


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

    app.include_router(create_api_router())
    register_exception_handlers(app)
    return app


app = create_application()
handler = Mangum(app)
