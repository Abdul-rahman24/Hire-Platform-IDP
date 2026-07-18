from fastapi import APIRouter, Depends, Response, status

from app.dependencies.providers import get_section_service
from app.schemas.section import (
    SectionCreateRequest,
    SectionListResponse,
    SectionResponse,
    SectionUpdateRequest,
)
from app.services.interfaces import SectionServiceInterface

router = APIRouter(tags=["Sections"])


@router.post(
    "/tests/{testId}/sections",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create section",
    description="Create a section under a specific test.",
)
async def create_section(
    testId: str,
    payload: SectionCreateRequest,
    service: SectionServiceInterface = Depends(get_section_service),
) -> SectionResponse:
    return service.create_section(testId, payload)


@router.get(
    "/tests/{testId}/sections",
    response_model=SectionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List sections",
    description="List all sections for a specific test.",
)
async def list_sections(
    testId: str,
    service: SectionServiceInterface = Depends(get_section_service),
) -> SectionListResponse:
    items = service.list_sections(testId)
    return SectionListResponse(items=items, count=len(items))


@router.get(
    "/sections/{sectionId}",
    response_model=SectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get section",
    description="Fetch a single section by id.",
)
async def get_section(
    sectionId: str,
    service: SectionServiceInterface = Depends(get_section_service),
) -> SectionResponse:
    return service.get_section(sectionId)


@router.put(
    "/sections/{sectionId}",
    response_model=SectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update section",
    description="Update an existing section.",
)
async def update_section(
    sectionId: str,
    payload: SectionUpdateRequest,
    service: SectionServiceInterface = Depends(get_section_service),
) -> SectionResponse:
    return service.update_section(sectionId, payload)


@router.delete(
    "/sections/{sectionId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete section",
    description="Delete a section by id.",
)
async def delete_section(
    sectionId: str,
    service: SectionServiceInterface = Depends(get_section_service),
) -> Response:
    service.delete_section(sectionId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
