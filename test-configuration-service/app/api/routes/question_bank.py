from fastapi import APIRouter, Depends, status

from app.dependencies.providers import get_question_bank_service
from app.schemas.question_bank import QuestionResponse, QuestionSetResponse
from app.services.interfaces import QuestionBankServiceInterface

router = APIRouter(tags=["Question Bank"])


@router.get(
    "/question-sets",
    response_model=list[QuestionSetResponse],
    status_code=status.HTTP_200_OK,
    summary="List question sets",
    description="List available question sets from the external Question Bank service.",
)
async def list_question_sets(
    service: QuestionBankServiceInterface = Depends(get_question_bank_service),
) -> list[QuestionSetResponse]:
    return service.list_question_sets()


@router.get(
    "/question-sets/{questionSetId}",
    response_model=QuestionSetResponse,
    status_code=status.HTTP_200_OK,
    summary="Get question set",
    description="Fetch a single mock question set from the Question Bank provider.",
)
async def get_question_set(
    questionSetId: str,
    service: QuestionBankServiceInterface = Depends(get_question_bank_service),
) -> QuestionSetResponse:
    return service.get_question_set(questionSetId)


@router.get(
    "/question-sets/{questionSetId}/questions",
    response_model=list[QuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="List questions by question set",
    description="List questions in a specific question set from the external Question Bank service.",
)
async def list_questions(
    questionSetId: str,
    service: QuestionBankServiceInterface = Depends(get_question_bank_service),
) -> list[QuestionResponse]:
    return service.list_questions(questionSetId)
