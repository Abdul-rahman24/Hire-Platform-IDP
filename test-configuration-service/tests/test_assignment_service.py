from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryNotFoundException,
    ServiceException,
)
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
    AssignmentUpdateRequest,
    BulkAssignmentCreateRequest,
    BulkAssignmentStudentRequest,
)
from app.services.assignment_service import AssignmentService


class FakeAssignmentRepository(AssignmentRepositoryInterface[AssignmentEntity]):
    def __init__(self) -> None:
        self.entities: dict[str, AssignmentEntity] = {}

    def create(self, entity: AssignmentEntity) -> AssignmentEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> AssignmentEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("AssignmentEntity not found")
        return entity

    def list(self) -> list[AssignmentEntity]:
        return list(self.entities.values())

    def update(self, entity_id: str, entity: AssignmentEntity) -> AssignmentEntity:
        current = self.get(entity_id)
        updated = entity.model_copy(
            update={
                "id": entity_id,
                "created_at": current.created_at,
                "updated_at": datetime.now(UTC),
            },
        )
        self.entities[entity_id] = updated
        return updated

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)

    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        items = list(self.entities.values())
        if student_id is not None:
            items = [item for item in items if item.student_id == student_id]
        if test_id is not None:
            items = [item for item in items if item.test_id == test_id]
        if status is not None:
            items = [item for item in items if item.status == status]
        return items

    def list_by_student_id(self, student_id: str, status: str | None = None) -> list[AssignmentEntity]:
        return self.list_assignments(student_id=student_id, status=status)

    def list_by_test_id(self, test_id: str, status: str | None = None) -> list[AssignmentEntity]:
        return self.list_assignments(test_id=test_id, status=status)

    def soft_delete(self, assignment_id: str) -> AssignmentEntity:
        entity = self.get(assignment_id)
        updated = entity.model_copy(update={"status": "cancelled", "updated_at": datetime.now(UTC)})
        self.entities[assignment_id] = updated
        return updated


class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self, status: str = "published") -> None:
        timestamp = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
        self.entities = {
            "test-1": TestEntity(
                id="test-1",
                name="Published Test",
                description="Ready to assign",
                status=status,
                created_at=timestamp,
                updated_at=timestamp,
            )
        }

    def create(self, entity: TestEntity) -> TestEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> TestEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("TestEntity not found")
        return entity

    def list(self) -> list[TestEntity]:
        return list(self.entities.values())

    def update(self, entity_id: str, entity: TestEntity) -> TestEntity:
        self.entities[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)


class FakePublishedTestRepository(PublishedTestRepositoryInterface[PublishedTestEntity]):
    def create(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        return entity

    def get_latest(self, test_id: str) -> PublishedTestEntity:
        timestamp = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
        return PublishedTestEntity(
            testId=test_id,
            version=1,
            publishedAt=timestamp,
            name="Published Test",
            description="Ready to assign",
            status="published",
            sections=[],
        )

    def get_version(self, test_id: str, version: int) -> PublishedTestEntity:
        return self.get_latest(test_id)

    def get_latest_version_number(self, test_id: str) -> int:
        return 1

    def publish_snapshot(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        return entity


def build_service(test_status: str = "published") -> tuple[AssignmentService, FakeAssignmentRepository]:
    repository = FakeAssignmentRepository()
    service = AssignmentService(
        repository=repository,
        test_repository=FakeTestRepository(status=test_status),
        published_test_repository=FakePublishedTestRepository(),
    )
    return service, repository


def build_assignment_request(student_id: str = "student-1") -> AssignmentCreateRequest:
    return AssignmentCreateRequest(
        testId="test-1",
        studentId=student_id,
        studentName="Ada",
        studentEmail="ada@example.com",
        assignedBy="admin",
        startDate=datetime(2026, 7, 18, 0, 0, tzinfo=UTC),
        endDate=datetime(2026, 7, 19, 0, 0, tzinfo=UTC),
        status="assigned",
    )


def test_create_assignment_returns_response() -> None:
    service, repository = build_service()

    result = service.create_assignment(build_assignment_request())

    assert result.test_id == "test-1"
    assert result.student_id == "student-1"
    assert len(repository.entities) == 1


def test_create_assignment_rejects_unpublished_test() -> None:
    service, _ = build_service(test_status="draft")

    with pytest.raises(ServiceException, match="Only published tests can be assigned"):
        service.create_assignment(build_assignment_request())


def test_create_assignment_rejects_duplicate_active_assignment() -> None:
    service, repository = build_service()
    service.create_assignment(build_assignment_request())

    with pytest.raises(RepositoryConflictException, match="Active assignment already exists"):
        service.create_assignment(build_assignment_request())

    assert len(repository.entities) == 1


def test_bulk_assignments_counts_assigned_and_skipped() -> None:
    service, _ = build_service()
    service.create_assignment(build_assignment_request(student_id="student-1"))

    result = service.create_bulk_assignments(
        BulkAssignmentCreateRequest(
            testId="test-1",
            assignedBy="admin",
            startDate=datetime(2026, 7, 18, 0, 0, tzinfo=UTC),
            endDate=datetime(2026, 7, 19, 0, 0, tzinfo=UTC),
            students=[
                BulkAssignmentStudentRequest(
                    studentId="student-1",
                    studentName="Ada",
                    studentEmail="ada@example.com",
                ),
                BulkAssignmentStudentRequest(
                    studentId="student-2",
                    studentName="Grace",
                    studentEmail="grace@example.com",
                ),
            ],
        )
    )

    assert result.number_assigned == 1
    assert result.number_skipped == 1


def test_update_assignment_rejects_completed_assignments() -> None:
    service, repository = build_service()
    created = service.create_assignment(build_assignment_request())
    repository.entities[created.id] = repository.entities[created.id].model_copy(update={"status": "completed"})

    with pytest.raises(RepositoryConflictException, match="Completed assignments cannot be updated"):
        service.update_assignment(
            created.id,
            AssignmentUpdateRequest(status="cancelled"),
        )


def test_delete_assignment_soft_cancels() -> None:
    service, repository = build_service()
    created = service.create_assignment(build_assignment_request())

    service.delete_assignment(created.id)

    assert repository.get(created.id).status == "cancelled"


def test_delete_assignment_rejects_completed_assignments() -> None:
    service, repository = build_service()
    created = service.create_assignment(build_assignment_request())
    repository.entities[created.id] = repository.entities[created.id].model_copy(update={"status": "completed"})

    with pytest.raises(RepositoryConflictException, match="Completed assignments cannot be cancelled"):
        service.delete_assignment(created.id)
