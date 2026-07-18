from fastapi import APIRouter, Depends, Response, status

from app.dependencies.providers import get_question_service
from app.schemas.question import (
    QuestionCreateRequest,
    QuestionListResponse,
    QuestionResponse,
    QuestionUpdateRequest,
)
from app.services.interfaces import QuestionServiceInterface

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.post(
    "",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create question",
    description="Create a new question definition.",
)
async def create_question(
    payload: QuestionCreateRequest,
    service: QuestionServiceInterface = Depends(get_question_service),
) -> QuestionResponse:
    return service.create_question(payload)


@router.get(
    "",
    response_model=QuestionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List questions",
    description="List all configured questions.",
)
async def list_questions(
    service: QuestionServiceInterface = Depends(get_question_service),
) -> QuestionListResponse:
    items = service.list_questions()
    return QuestionListResponse(items=items, count=len(items))


@router.get(
    "/{questionId}",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get question",
    description="Fetch a single question by id.",
)
async def get_question(
    questionId: str,
    service: QuestionServiceInterface = Depends(get_question_service),
) -> QuestionResponse:
    return service.get_question(questionId)


@router.put(
    "/{questionId}",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update question",
    description="Replace an existing question by id.",
)
async def update_question(
    questionId: str,
    payload: QuestionUpdateRequest,
    service: QuestionServiceInterface = Depends(get_question_service),
) -> QuestionResponse:
    return service.update_question(questionId, payload)


@router.delete(
    "/{questionId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete question",
    description="Delete a question by id.",
)
async def delete_question(
    questionId: str,
    service: QuestionServiceInterface = Depends(get_question_service),
) -> Response:
    service.delete_question(questionId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
