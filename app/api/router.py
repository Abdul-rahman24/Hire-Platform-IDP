from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.question_bank import router as question_bank_router
from app.api.routes.sections import router as section_router
from app.api.routes.tests import router as test_router


def create_api_router() -> APIRouter:
    api_router = APIRouter()
    api_router.include_router(health_router)
    api_router.include_router(question_bank_router)
    api_router.include_router(test_router)
    api_router.include_router(section_router)
    return api_router
