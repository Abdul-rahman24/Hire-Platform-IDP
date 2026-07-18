from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryNotFoundException
from app.models.assignment import AssignmentEntity
from app.repositories.assignment_repository import AssignmentRepository
from tests.test_repositories import FakeDynamoTable


class FakeAssignmentTable(FakeDynamoTable):
    def __init__(self) -> None:
        super().__init__()
        self.name = "test-config-assignments"
        self.key_schema = [
            {"AttributeName": "assignmentId", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ]
        self.attribute_definitions = [
            {"AttributeName": "assignmentId", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
        ]

    def scan(self, ExclusiveStartKey: dict | None = None, FilterExpression=None) -> dict:
        items = list(self.items.values())
        if FilterExpression is None:
            return {"Items": items}
        return {"Items": [item for item in items if self._matches_filter(item, FilterExpression)]}

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
        key_name = "studentId" if IndexName == "GSI1" else "testId"
        filtered_items = [
            item
            for item in self.items.values()
            if item.get(key_name) == key_value and self._matches_filter(item, FilterExpression)
        ]
        filtered_items.sort(key=lambda item: item.get("assignedAt"), reverse=not ScanIndexForward)
        if Limit is not None:
            filtered_items = filtered_items[:Limit]
        return {"Items": filtered_items}

    def _item_key(self, item: dict) -> tuple[str, str]:
        if "assignmentId" in item:
            return (item["assignmentId"], item.get("SK", "META"))
        return super()._item_key(item)

    def _matches_filter(self, item: dict, expression) -> bool:
        if expression is None:
            return True
        values = getattr(expression, "_values", ())
        operator = expression.__class__.__name__
        if operator == "And":
            return all(self._matches_filter(item, value) for value in values)
        if len(values) == 2:
            attribute = values[0]
            expected_value = values[1]
            attribute_name = getattr(attribute, "name", None)
            return item.get(attribute_name) == expected_value
        raise AssertionError("Unsupported filter expression shape in fake assignment table")


class FakeDynamoClientForAssignments:
    def __init__(self) -> None:
        self.table = FakeAssignmentTable()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeAssignmentTable:
        assert base_name == "assignments"
        return self.table


def build_assignment(
    assignment_id: str = "assignment-1",
    student_id: str = "student-1",
    test_id: str = "test-1",
    status: str = "assigned",
    assigned_at: datetime | None = None,
) -> AssignmentEntity:
    timestamp = assigned_at or datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
    return AssignmentEntity(
        assignmentId=assignment_id,
        testId=test_id,
        studentId=student_id,
        studentName="Ada",
        studentEmail="ada@example.com",
        assignedBy="admin",
        assignedAt=timestamp,
        startDate=datetime(2026, 7, 18, 0, 0, tzinfo=UTC),
        endDate=datetime(2026, 7, 19, 0, 0, tzinfo=UTC),
        status=status,
        created_at=timestamp,
        updated_at=timestamp,
    )


def test_assignment_repository_create_and_get_item() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())
    entity = build_assignment()

    created = repository.create(entity)
    fetched = repository.get(entity.id)
    stored_item = repository.table.items[("assignment-1", "META")]

    assert created == entity
    assert fetched.id == "assignment-1"
    assert repository.table.last_get_key == {"assignmentId": "assignment-1", "SK": "META"}
    assert stored_item["assignmentId"] == "assignment-1"
    assert stored_item["testId"] == "test-1"
    assert stored_item["studentId"] == "student-1"
    assert stored_item["assignedAt"] == "2026-07-17T00:00:00+00:00"
    assert "id" not in stored_item


def test_assignment_repository_queries_by_student_id() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())
    repository.create(build_assignment(assignment_id="assignment-1", assigned_at=datetime(2026, 7, 17, 1, 0, tzinfo=UTC)))
    repository.create(build_assignment(assignment_id="assignment-2", assigned_at=datetime(2026, 7, 17, 2, 0, tzinfo=UTC)))
    repository.create(build_assignment(assignment_id="assignment-3", student_id="student-2"))

    items = repository.list_by_student_id("student-1")

    assert [item.id for item in items] == ["assignment-1", "assignment-2"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI1"


def test_assignment_repository_queries_by_test_id_and_status() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())
    repository.create(build_assignment(assignment_id="assignment-1", status="assigned"))
    repository.create(build_assignment(assignment_id="assignment-2", status="cancelled"))
    repository.create(build_assignment(assignment_id="assignment-3", test_id="test-2"))

    items = repository.list_by_test_id("test-1", status="assigned")

    assert [item.id for item in items] == ["assignment-1"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI2"


def test_assignment_repository_lists_with_combined_filters() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())
    repository.create(build_assignment(assignment_id="assignment-1", student_id="student-1", test_id="test-1"))
    repository.create(build_assignment(assignment_id="assignment-2", student_id="student-1", test_id="test-2"))

    items = repository.list_assignments(student_id="student-1", test_id="test-2")

    assert [item.id for item in items] == ["assignment-2"]


def test_assignment_repository_soft_delete_marks_cancelled() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())
    repository.create(build_assignment())

    cancelled = repository.soft_delete("assignment-1")

    assert cancelled.status == "cancelled"
    assert repository.get("assignment-1").status == "cancelled"


def test_assignment_repository_delete_missing_raises_not_found() -> None:
    repository = AssignmentRepository(dynamodb_client=FakeDynamoClientForAssignments())

    with pytest.raises(RepositoryNotFoundException):
        repository.get("missing")
