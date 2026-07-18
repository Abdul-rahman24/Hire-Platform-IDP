from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException, ServiceException
from app.models.assignment import AssignmentEntity
from app.models.exam_session import ExamSessionEntity
from app.models.published_test import PublishedSectionSnapshot, PublishedTestEntity
from app.repositories.interfaces import (
    AssignmentRepositoryInterface,
    ExamSessionRepositoryInterface,
    PublishedTestRepositoryInterface,
)
from app.schemas.exam_session import ExamSessionCreateRequest, ExamSessionHeartbeatRequest
from app.services.exam_session_service import ExamSessionService


class FakeExamSessionRepository(ExamSessionRepositoryInterface[ExamSessionEntity]):
    def __init__(self) -> None:
        self.entities: dict[str, ExamSessionEntity] = {}

    def create(self, entity: ExamSessionEntity) -> ExamSessionEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> ExamSessionEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("ExamSessionEntity not found")
        return entity

    def list(self) -> list[ExamSessionEntity]:
        return list(self.entities.values())

    def update(self, entity_id: str, entity: ExamSessionEntity) -> ExamSessionEntity:
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

    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[ExamSessionEntity]:
        items = list(self.entities.values())
        if student_id is not None:
            items = [item for item in items if item.student_id == student_id]
        if assignment_id is not None:
            items = [item for item in items if item.assignment_id == assignment_id]
        if status is not None:
            items = [item for item in items if item.status == status]
        return items

    def list_by_assignment_id(self, assignment_id: str, status: str | None = None) -> list[ExamSessionEntity]:
        return self.list_sessions(assignment_id=assignment_id, status=status)

    def list_by_student_id(self, student_id: str, status: str | None = None) -> list[ExamSessionEntity]:
        return self.list_sessions(student_id=student_id, status=status)


class FakeAssignmentRepository(AssignmentRepositoryInterface[AssignmentEntity]):
    def __init__(self, status: str = "assigned") -> None:
        timestamp = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
        self.entities = {
            "assignment-1": AssignmentEntity(
                assignmentId="assignment-1",
                testId="test-1",
                studentId="student-1",
                studentName="Ada",
                studentEmail="ada@example.com",
                assignedBy="admin",
                assignedAt=timestamp,
                startDate=timestamp,
                endDate=timestamp + timedelta(days=7),
                status=status,
                created_at=timestamp,
                updated_at=timestamp,
            )
        }

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
        self.entities[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)

    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        return list(self.entities.values())

    def list_by_student_id(self, student_id: str, status: str | None = None) -> list[AssignmentEntity]:
        return list(self.entities.values())

    def list_by_test_id(self, test_id: str, status: str | None = None) -> list[AssignmentEntity]:
        return list(self.entities.values())

    def soft_delete(self, assignment_id: str) -> AssignmentEntity:
        entity = self.get(assignment_id)
        updated = entity.model_copy(update={"status": "cancelled"})
        self.entities[assignment_id] = updated
        return updated


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
            description="Ready",
            status="published",
            sections=[
                PublishedSectionSnapshot(
                    sectionId="section-1",
                    name="Math",
                    duration=30,
                    displayOrder=1,
                    questions=[],
                ),
                PublishedSectionSnapshot(
                    sectionId="section-2",
                    name="English",
                    duration=25,
                    displayOrder=2,
                    questions=[],
                ),
            ],
        )

    def get_version(self, test_id: str, version: int) -> PublishedTestEntity:
        return self.get_latest(test_id)

    def get_latest_version_number(self, test_id: str) -> int:
        return 1

    def publish_snapshot(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        return entity


def build_service(assignment_status: str = "assigned") -> tuple[ExamSessionService, FakeExamSessionRepository]:
    repository = FakeExamSessionRepository()
    service = ExamSessionService(
        repository=repository,
        assignment_repository=FakeAssignmentRepository(status=assignment_status),
        published_test_repository=FakePublishedTestRepository(),
    )
    return service, repository


def build_create_request(student_id: str = "student-1") -> ExamSessionCreateRequest:
    return ExamSessionCreateRequest(
        assignmentId="assignment-1",
        studentId=student_id,
        ipAddress="127.0.0.1",
        userAgent="codex",
        autoSubmit=True,
    )


def test_create_session_returns_response() -> None:
    service, repository = build_service()

    result = service.create_session(build_create_request())

    assert result.assignment_id == "assignment-1"
    assert result.total_duration == 55
    assert len(repository.entities) == 1


def test_create_session_rejects_student_mismatch() -> None:
    service, _ = build_service()

    with pytest.raises(ServiceException, match="Student does not match the assignment"):
        service.create_session(build_create_request(student_id="student-2"))


def test_create_session_rejects_cancelled_assignment() -> None:
    service, _ = build_service(assignment_status="cancelled")

    with pytest.raises(ServiceException, match="Cancelled assignments cannot create exam sessions"):
        service.create_session(build_create_request())


def test_create_session_rejects_duplicate_active_session() -> None:
    service, repository = build_service()
    created = service.create_session(build_create_request())
    repository.entities[created.id] = repository.entities[created.id].model_copy(update={"status": "started"})

    with pytest.raises(RepositoryConflictException, match="unfinished exam session already exists"):
        service.create_session(build_create_request())


def test_start_session_transitions_to_started() -> None:
    service, _ = build_service()
    created = service.create_session(build_create_request())

    result = service.start_session(created.id)

    assert result.status == "started"
    assert result.started_at is not None
    assert result.expires_at is not None
    assert result.remaining_time == 55


def test_submit_session_transitions_to_submitted() -> None:
    service, repository = build_service()
    created = service.create_session(build_create_request())
    started = service.start_session(created.id)
    repository.entities[started.id] = repository.entities[started.id].model_copy(update={"remaining_time": 20})

    result = service.submit_session(created.id)

    assert result.status == "submitted"
    assert result.submitted_at is not None


def test_heartbeat_updates_remaining_time() -> None:
    service, repository = build_service()
    created = service.create_session(build_create_request())
    started = service.start_session(created.id)
    repository.entities[started.id] = repository.entities[started.id].model_copy(
        update={
            "started_at": datetime.now(UTC) - timedelta(minutes=10),
            "expires_at": datetime.now(UTC) + timedelta(minutes=40),
            "remaining_time": 45,
        },
    )

    result = service.heartbeat(created.id, ExamSessionHeartbeatRequest(remainingTime=35))

    assert result.remaining_time == 35


def test_heartbeat_rejects_time_extension() -> None:
    service, repository = build_service()
    created = service.create_session(build_create_request())
    started = service.start_session(created.id)
    repository.entities[started.id] = repository.entities[started.id].model_copy(
        update={
            "started_at": datetime.now(UTC) - timedelta(minutes=10),
            "expires_at": datetime.now(UTC) + timedelta(minutes=40),
            "remaining_time": 30,
        },
    )

    with pytest.raises(ServiceException, match="Heartbeat cannot extend exam time"):
        service.heartbeat(created.id, ExamSessionHeartbeatRequest(remainingTime=40))


def test_get_session_auto_submits_expired_started_session() -> None:
    service, repository = build_service()
    created = service.create_session(build_create_request())
    repository.entities[created.id] = repository.entities[created.id].model_copy(
        update={
            "status": "started",
            "started_at": datetime.now(UTC) - timedelta(minutes=60),
            "expires_at": datetime.now(UTC) - timedelta(minutes=1),
            "remaining_time": 5,
        },
    )

    result = service.get_session(created.id)

    assert result.status == "auto_submitted"
    assert result.remaining_time == 0
