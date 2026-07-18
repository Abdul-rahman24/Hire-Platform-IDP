from fastapi import APIRouter

from app.api.routes.assignments import router as assignment_router
from app.api.routes.exam_sessions import router as exam_session_router
from app.api.routes.health import router as health_router
from app.api.routes.question_bank import router as question_bank_router
from app.api.routes.questions import router as question_router
from app.api.routes.sections import router as section_router
from app.api.routes.section_question_mappings import router as section_question_mapping_router
from app.api.routes.tests import router as test_router


def create_api_router() -> APIRouter:
    api_router = APIRouter()
    api_router.include_router(health_router)
    api_router.include_router(question_bank_router)
    api_router.include_router(question_router)
    api_router.include_router(test_router)
    api_router.include_router(assignment_router)
    api_router.include_router(exam_session_router)
    api_router.include_router(section_router)
    api_router.include_router(section_question_mapping_router)
    return api_router
