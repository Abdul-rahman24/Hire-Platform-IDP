from fastapi import APIRouter, Depends, Response, status

from app.dependencies.providers import get_test_service
from app.schemas.test import (
    CompleteTestResponse,
    FullTestResponse,
    PublishTestResponse,
    PublishedTestResponse,
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
    response_model=CompleteTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete test template",
    description="Fetch a test with nested sections and question mapping details.",
)
async def get_complete_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> CompleteTestResponse:
    return service.get_complete_test(testId)


@router.get(
    "/{testId}/full",
    response_model=FullTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get full student-facing test",
    description="Fetch a fully assembled test with sections, question set details, and questions.",
)
async def get_full_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> FullTestResponse:
    return service.get_full_test(testId)


@router.get(
    "/{testId}",
    response_model=TestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get test",
    description="Fetch a single test by id.",
)
async def get_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.get_test(testId)


@router.post(
    "/{testId}/publish",
    response_model=PublishTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Publish test",
    description="Validate a test hierarchy, create an immutable snapshot, and mark the test as published.",
)
async def publish_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> PublishTestResponse:
    return service.publish_test(testId)


@router.get(
    "/{testId}/published",
    response_model=PublishedTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get latest published test snapshot",
    description="Fetch the latest immutable published snapshot for a test.",
)
async def get_latest_published_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> PublishedTestResponse:
    return service.get_latest_published_test(testId)


@router.get(
    "/{testId}/published/{version}",
    response_model=PublishedTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get published test snapshot by version",
    description="Fetch a specific immutable published snapshot version for a test.",
)
async def get_published_test_version(
    testId: str,
    version: int,
    service: TestServiceInterface = Depends(get_test_service),
) -> PublishedTestResponse:
    return service.get_published_test_version(testId, version)


@router.put(
    "/{testId}",
    response_model=TestResponse,
    status_code=status.HTTP_200_OK,
    summary="Update test",
    description="Replace an existing test by id.",
)
async def update_test(
    testId: str,
    payload: TestUpdateRequest,
    service: TestServiceInterface = Depends(get_test_service),
) -> TestResponse:
    return service.update_test(testId, payload)


@router.delete(
    "/{testId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete test",
    description="Delete a test by id.",
)
async def delete_test(
    testId: str,
    service: TestServiceInterface = Depends(get_test_service),
) -> Response:
    service.delete_test(testId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
