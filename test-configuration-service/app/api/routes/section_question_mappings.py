from fastapi import APIRouter, Depends, status

from app.dependencies.providers import get_section_question_mapping_service
from app.schemas.section_question_mapping import (
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
)
async def create_section_question_mapping(
    sectionId: str,
    payload: SectionQuestionMappingCreateRequest,
    service: SectionQuestionMappingServiceInterface = Depends(get_section_question_mapping_service),
) -> SectionQuestionMappingResponse:
    return service.create_mapping(sectionId, payload)


@router.get(
    "/sections/{sectionId}/questions",
    response_model=list[SectionQuestionMappingResponse],
    status_code=status.HTTP_200_OK,
)
async def list_section_question_mappings(
    sectionId: str,
    service: SectionQuestionMappingServiceInterface = Depends(get_section_question_mapping_service),
) -> list[SectionQuestionMappingResponse]:
    return service.list_section_questions(sectionId)


@router.get(
    "/sections/{sectionId}/questions/{questionId}",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_200_OK,
)
async def get_section_question_mapping(
    sectionId: str,
    questionId: str,
    service: SectionQuestionMappingServiceInterface = Depends(get_section_question_mapping_service),
) -> SectionQuestionMappingResponse:
    return service.get_mapping(sectionId, questionId)


@router.put(
    "/sections/{sectionId}/questions/{questionId}",
    response_model=SectionQuestionMappingResponse,
    status_code=status.HTTP_200_OK,
)
async def update_section_question_mapping(
    sectionId: str,
    questionId: str,
    payload: SectionQuestionMappingUpdateRequest,
    service: SectionQuestionMappingServiceInterface = Depends(get_section_question_mapping_service),
) -> SectionQuestionMappingResponse:
    return service.update_mapping(sectionId, questionId, payload)


@router.delete(
    "/sections/{sectionId}/questions/{questionId}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_section_question_mapping(
    sectionId: str,
    questionId: str,
    service: SectionQuestionMappingServiceInterface = Depends(get_section_question_mapping_service),
) -> None:
    service.delete_mapping(sectionId, questionId)
