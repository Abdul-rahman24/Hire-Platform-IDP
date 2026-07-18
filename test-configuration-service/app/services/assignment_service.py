from __future__ import annotations

from datetime import UTC, datetime

from app.core.exceptions import RepositoryConflictException, ServiceException
from app.core.logging import get_logger
from app.models.assignment import AssignmentEntity
from app.models.published_test import PublishedTestEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    AssignmentRepositoryInterface,
    PublishedTestRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.assignment import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    BulkAssignmentCreateRequest,
    BulkAssignmentResponse,
)
from app.services.interfaces import AssignmentServiceInterface

logger = get_logger(__name__)

ACTIVE_ASSIGNMENT_STATUSES = {"assigned", "active"}
IMMUTABLE_ASSIGNMENT_STATUSES = {"completed", "expired"}


class AssignmentService(AssignmentServiceInterface):
    def __init__(
        self,
        repository: AssignmentRepositoryInterface[AssignmentEntity],
        test_repository: TestRepositoryInterface[TestEntity],
        published_test_repository: PublishedTestRepositoryInterface[PublishedTestEntity],
    ) -> None:
        self.repository = repository
        self.test_repository = test_repository
        self.published_test_repository = published_test_repository

    def create_assignment(self, payload: AssignmentCreateRequest) -> AssignmentResponse:
        logger.info(
            "Creating assignment for test '%s' and student '%s'",
            payload.test_id,
            payload.student_id,
        )
        self._validate_assignable_test(payload.test_id)
        self._ensure_no_duplicate_active_assignment(payload.test_id, payload.student_id)
        entity = AssignmentEntity(
            testId=payload.test_id,
            studentId=payload.student_id,
            studentName=payload.student_name,
            studentEmail=payload.student_email,
            assignedBy=payload.assigned_by,
            assignedAt=datetime.now(UTC),
            startDate=payload.start_date,
            endDate=payload.end_date,
            status=payload.status,
        )
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity)

    def create_bulk_assignments(self, payload: BulkAssignmentCreateRequest) -> BulkAssignmentResponse:
        logger.info(
            "Creating bulk assignments for test '%s' with %s students",
            payload.test_id,
            len(payload.students),
        )
        self._validate_assignable_test(payload.test_id)
        number_assigned = 0
        number_skipped = 0
        for student in payload.students:
            if self._has_duplicate_active_assignment(payload.test_id, student.student_id):
                number_skipped += 1
                continue
            entity = AssignmentEntity(
                testId=payload.test_id,
                studentId=student.student_id,
                studentName=student.student_name,
                studentEmail=student.student_email,
                assignedBy=payload.assigned_by,
                assignedAt=datetime.now(UTC),
                startDate=payload.start_date,
                endDate=payload.end_date,
                status="assigned",
            )
            self.repository.create(entity)
            number_assigned += 1
        return BulkAssignmentResponse(
            testId=payload.test_id,
            numberAssigned=number_assigned,
            numberSkipped=number_skipped,
        )

    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentResponse]:
        logger.info(
            "Listing assignments with filters student_id=%s test_id=%s status=%s",
            student_id,
            test_id,
            status,
        )
        entities = self.repository.list_assignments(
            student_id=student_id,
            test_id=test_id,
            status=status,
        )
        return [self._to_response(entity) for entity in entities]

    def get_assignment(self, assignment_id: str) -> AssignmentResponse:
        logger.info("Fetching assignment '%s'", assignment_id)
        entity = self.repository.get(assignment_id)
        return self._to_response(entity)

    def update_assignment(
        self,
        assignment_id: str,
        payload: AssignmentUpdateRequest,
    ) -> AssignmentResponse:
        logger.info("Updating assignment '%s'", assignment_id)
        existing_entity = self.repository.get(assignment_id)
        self._ensure_assignment_is_mutable(existing_entity)

        start_date = payload.start_date or existing_entity.start_date
        end_date = payload.end_date or existing_entity.end_date
        if end_date <= start_date:
            raise ServiceException("endDate must be after startDate", status_code=400)

        updated_entity = existing_entity.model_copy(
            update={
                "start_date": start_date,
                "end_date": end_date,
                "status": payload.status or existing_entity.status,
            },
        )
        stored_entity = self.repository.update(assignment_id, updated_entity)
        return self._to_response(stored_entity)

    def delete_assignment(self, assignment_id: str) -> None:
        logger.info("Soft deleting assignment '%s'", assignment_id)
        existing_entity = self.repository.get(assignment_id)
        if existing_entity.status == "completed":
            raise RepositoryConflictException("Completed assignments cannot be cancelled")
        self.repository.soft_delete(assignment_id)

    def _validate_assignable_test(self, test_id: str) -> None:
        test = self.test_repository.get(test_id)
        if test.status == "archived":
            raise ServiceException("Archived tests cannot be assigned", status_code=400)
        if test.status != "published":
            raise ServiceException("Only published tests can be assigned", status_code=400)
        self.published_test_repository.get_latest(test_id)

    def _ensure_no_duplicate_active_assignment(self, test_id: str, student_id: str) -> None:
        if self._has_duplicate_active_assignment(test_id, student_id):
            raise RepositoryConflictException(
                f"Active assignment already exists for student '{student_id}' and test '{test_id}'",
            )

    def _has_duplicate_active_assignment(self, test_id: str, student_id: str) -> bool:
        assignments = self.repository.list_by_student_id(student_id)
        return any(
            assignment.test_id == test_id and assignment.status in ACTIVE_ASSIGNMENT_STATUSES
            for assignment in assignments
        )

    def _ensure_assignment_is_mutable(self, assignment: AssignmentEntity) -> None:
        if assignment.status in IMMUTABLE_ASSIGNMENT_STATUSES:
            raise RepositoryConflictException(
                f"{assignment.status.capitalize()} assignments cannot be updated",
            )

    def _to_response(self, entity: AssignmentEntity) -> AssignmentResponse:
        return AssignmentResponse.model_validate(entity.model_dump(mode="python"))
