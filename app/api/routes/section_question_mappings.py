from fastapi import APIRouter, Depends, status

from app.dependencies.providers import get_section_question_mapping_service
from app.schemas.question_bank import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingResponse,
    SectionQuestionMappingUpdateRequest,
)
from app.services.interfaces import SectionQuestionMappingServiceInterface

router = APIRouter(tags=["Section Questions"])


@router.post(
    "/sections/{sectionId}/questions",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create question mapping",
    description="Attach a question set and selected question ids to a section.",
)
async def create_question_mapping(
    sectionId: str,
    payload: SectionQuestionMappingCreateRequest,
    service: SectionQuestionMappingServiceInterface = Depends(
        get_section_question_mapping_service,
    ),
) -> SectionQuestionMappingResponse:
    return service.create_mapping(sectionId, payload)


@router.get(
    "/sections/{sectionId}/questions",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get question mapping",
    description="Fetch the question set and selected question ids mapped to a section.",
)
async def get_question_mapping(
    sectionId: str,
    service: SectionQuestionMappingServiceInterface = Depends(
        get_section_question_mapping_service,
    ),
) -> SectionQuestionMappingResponse:
    return service.get_mapping(sectionId)


@router.put(
    "/sections/{sectionId}/questions",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_200_OK,
    summary="Update question mapping",
    description="Replace the question set and selected question ids mapped to a section.",
)
async def update_question_mapping(
    sectionId: str,
    payload: SectionQuestionMappingUpdateRequest,
    service: SectionQuestionMappingServiceInterface = Depends(
        get_section_question_mapping_service,
    ),
) -> SectionQuestionMappingResponse:
    return service.update_mapping(sectionId, payload)


@router.delete(
    "/sections/{sectionId}/questions/{questionId}",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove question from section",
    description="Remove one selected question id from a section question mapping.",
)
async def delete_question_from_mapping(
    sectionId: str,
    questionId: str,
    service: SectionQuestionMappingServiceInterface = Depends(
        get_section_question_mapping_service,
    ),
) -> SectionQuestionMappingResponse:
    return service.remove_question(sectionId, questionId)
