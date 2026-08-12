from fastapi import APIRouter, Depends, Response, status

from app.dependencies.providers import get_test_service
from app.schemas.test import (
    TestCreateRequest,
    TestListResponse,
    TestResponse,
    TestUpdateRequest,
)
from app.services.interfaces import TestServiceInterface

router = APIRouter(prefix="/tests", tags=["Tests"])


@router.post(
    "",
    response_model=TestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
    summary="Create test",
    description="Create a new test definition.",
)
async def create_test(
    payload: TestCreateRequest,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.create_test(payload)


@router.get(
    "",
    response_model=TestListResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="List tests",
    description="List all configured tests.",
)
async def list_tests(
    service: TestServiceInterface = Depends(get_test_service),
) -> TestListResponse:
    items = service.list_tests()
    return TestListResponse(items=items, count=len(items))


@router.get(
    "/{testId}/complete",
    response_model=TestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="Get complete test template",
    description="Fetch a test with nested sections and dynamic questions.",
)
async def get_complete_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.get_complete_test(testId)


@router.get(
    "/{id}",
    response_model=TestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="Get test",
    description="Fetch a single test by id with nested section details and live questions.",
)
async def get_test(
    id: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.get_test(id)


@router.put(
    "/{id}",
    response_model=TestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="Update test",
    description="Replace an existing test by id.",
)
async def update_test(
    id: str,
    payload: TestUpdateRequest,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.update_test(id, payload)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete test",
    description="Delete a test by id.",
)
async def delete_test(
    id: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> Response:
    service.delete_test(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
