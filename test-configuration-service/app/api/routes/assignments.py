from fastapi import APIRouter, Depends, Query, Response, status

from app.dependencies.providers import get_assignment_service
from app.schemas.assignment import (
    AssignmentCreateRequest,
    AssignmentListResponse,
    AssignmentResponse,
    AssignmentUpdateRequest,
    BulkAssignmentCreateRequest,
    BulkAssignmentResponse,
)
from app.services.interfaces import AssignmentServiceInterface

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post(
    "",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create assignment",
    description="Assign a published test to a student.",
)
async def create_assignment(
    payload: AssignmentCreateRequest,
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> AssignmentResponse:
    return service.create_assignment(payload)


@router.post(
    "/bulk",
    response_model=BulkAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create bulk assignments",
    description="Assign a published test to multiple students.",
)
async def create_bulk_assignments(
    payload: BulkAssignmentCreateRequest,
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> BulkAssignmentResponse:
    return service.create_bulk_assignments(payload)


@router.get(
    "",
    response_model=AssignmentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List assignments",
    description="List assignments with optional student, test, and status filters.",
)
async def list_assignments(
    studentId: str | None = Query(default=None),
    testId: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> AssignmentListResponse:
    items = service.list_assignments(
        student_id=studentId,
        test_id=testId,
        status=status_filter,
    )
    return AssignmentListResponse(items=items, count=len(items))


@router.get(
    "/{assignmentId}",
    response_model=AssignmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get assignment",
    description="Fetch a single assignment by id.",
)
async def get_assignment(
    assignmentId: str,
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> AssignmentResponse:
    return service.get_assignment(assignmentId)


@router.put(
    "/{assignmentId}",
    response_model=AssignmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update assignment",
    description="Update assignment dates or status.",
)
async def update_assignment(
    assignmentId: str,
    payload: AssignmentUpdateRequest,
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> AssignmentResponse:
    return service.update_assignment(assignmentId, payload)


@router.delete(
    "/{assignmentId}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel assignment",
    description="Soft delete an assignment by marking it cancelled.",
)
async def delete_assignment(
    assignmentId: str,
    service: AssignmentServiceInterface = Depends(get_assignment_service),
) -> Response:
    service.delete_assignment(assignmentId)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
