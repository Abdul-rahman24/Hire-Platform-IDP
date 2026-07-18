from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryNotFoundException
from app.models.exam_session import ExamSessionEntity
from app.repositories.exam_session_repository import ExamSessionRepository
from tests.test_assignment_repository import FakeAssignmentTable


class FakeExamSessionTable(FakeAssignmentTable):
    def __init__(self) -> None:
        super().__init__()
        self.name = "test-config-exam-sessions"
        self.key_schema = [
            {"AttributeName": "sessionId", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ]
        self.attribute_definitions = [
            {"AttributeName": "sessionId", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
        ]

    def query(
        self,
        IndexName: str | None = None,
        KeyConditionExpression=None,
        FilterExpression=None,
        ScanIndexForward: bool = True,
        ExclusiveStartKey: dict | None = None,
        Limit: int | None = None,
    ) -> dict:
        self.last_query_kwargs = {
            "IndexName": IndexName,
            "KeyConditionExpression": KeyConditionExpression,
            "FilterExpression": FilterExpression,
            "ScanIndexForward": ScanIndexForward,
            "ExclusiveStartKey": ExclusiveStartKey,
            "Limit": Limit,
        }
        key_value = self._extract_key_condition_value(KeyConditionExpression)
        key_name = "assignmentId" if IndexName == "GSI1" else "studentId"
        filtered_items = [
            item
            for item in self.items.values()
            if item.get(key_name) == key_value and self._matches_filter(item, FilterExpression)
        ]
        filtered_items.sort(
            key=lambda item: item.get("startedAt") or item.get("created_at"),
            reverse=not ScanIndexForward,
        )
        if Limit is not None:
            filtered_items = filtered_items[:Limit]
        return {"Items": filtered_items}

    def _item_key(self, item: dict) -> tuple[str, str]:
        if "sessionId" in item:
            return (item["sessionId"], item.get("SK", "META"))
        return super()._item_key(item)


class FakeDynamoClientForExamSessions:
    def __init__(self) -> None:
        self.table = FakeExamSessionTable()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeExamSessionTable:
        assert base_name == "exam-sessions"
        return self.table


def build_session(
    session_id: str = "session-1",
    assignment_id: str = "assignment-1",
    student_id: str = "student-1",
    status: str = "created",
    started_at: datetime | None = None,
) -> ExamSessionEntity:
    timestamp = datetime(2026, 7, 17, 1, 0, tzinfo=UTC)
    return ExamSessionEntity(
        sessionId=session_id,
        assignmentId=assignment_id,
        testId="test-1",
        studentId=student_id,
        publishedVersion=1,
        status=status,
        startedAt=started_at,
        submittedAt=None,
        expiresAt=None,
        remainingTime=55,
        totalDuration=55,
        autoSubmit=True,
        ipAddress="127.0.0.1",
        userAgent="codex",
        created_at=timestamp,
        updated_at=timestamp,
    )


def test_exam_session_repository_create_and_get_item() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())
    entity = build_session()

    created = repository.create(entity)
    fetched = repository.get(entity.id)
    stored_item = repository.table.items[("session-1", "META")]

    assert created == entity
    assert fetched.id == "session-1"
    assert repository.table.last_get_key == {"sessionId": "session-1", "SK": "META"}
    assert stored_item["sessionId"] == "session-1"
    assert stored_item["assignmentId"] == "assignment-1"
    assert "id" not in stored_item
    assert "startedAt" not in stored_item
    assert "submittedAt" not in stored_item
    assert "expiresAt" not in stored_item


def test_exam_session_repository_queries_by_assignment_id() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())
    repository.create(build_session(session_id="session-1", started_at=datetime(2026, 7, 17, 1, 0, tzinfo=UTC)))
    repository.create(build_session(session_id="session-2", started_at=None))
    repository.create(build_session(session_id="session-3", assignment_id="assignment-2"))

    items = repository.list_by_assignment_id("assignment-1")

    assert [item.id for item in items] == ["session-1", "session-2"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI1"


def test_exam_session_repository_queries_by_student_id_and_status() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())
    repository.create(build_session(session_id="session-1", status="created"))
    repository.create(build_session(session_id="session-2", status="submitted"))
    repository.create(build_session(session_id="session-3", student_id="student-2"))

    items = repository.list_by_student_id("student-1", status="created")

    assert [item.id for item in items] == ["session-1"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI2"


def test_exam_session_repository_lists_with_combined_filters() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())
    repository.create(build_session(session_id="session-1", assignment_id="assignment-1", student_id="student-1"))
    repository.create(build_session(session_id="session-2", assignment_id="assignment-2", student_id="student-1"))

    items = repository.list_sessions(student_id="student-1", assignment_id="assignment-2")

    assert [item.id for item in items] == ["session-2"]


def test_exam_session_repository_update_preserves_created_at() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())
    repository.create(build_session())

    updated = repository.update(
        "session-1",
        build_session(session_id="ignored", status="started", started_at=datetime(2026, 7, 17, 2, 0, tzinfo=UTC)),
    )

    assert updated.id == "session-1"
    assert updated.created_at == datetime(2026, 7, 17, 1, 0, tzinfo=UTC)


def test_exam_session_repository_get_missing_raises_not_found() -> None:
    repository = ExamSessionRepository(dynamodb_client=FakeDynamoClientForExamSessions())

    with pytest.raises(RepositoryNotFoundException):
        repository.get("missing")
