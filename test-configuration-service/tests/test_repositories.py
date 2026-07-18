from datetime import UTC, datetime
from decimal import Decimal

import pytest
from botocore.exceptions import ClientError

from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryNotFoundException,
)
from app.models.section import SectionEntity
from app.models.question import QuestionEntity
from app.repositories.question_repository import QuestionRepository
from app.repositories.section_repository import SectionRepository
from app.models.test import TestEntity
from app.repositories.test_repository import TestRepository


class FakeDynamoTable:
    def __init__(self) -> None:
        self.items: dict[tuple[str, str], dict] = {}
        self.name = "fake-table"
        self.last_get_key: dict | None = None
        self.last_put_item: dict | None = None
        self.last_put_condition_expression: str | None = None
        self.last_delete_key: dict | None = None
        self.last_delete_condition_expression: str | None = None
        self.last_query_kwargs: dict | None = None
        self.table_status = "ACTIVE"
        self.key_schema = [
            {"AttributeName": "testId", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ]
        self.attribute_definitions = [
            {"AttributeName": "testId", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
        ]

    def load(self) -> dict:
        return {"ResponseMetadata": {"RetryAttempts": 0}}

    def put_item(self, Item: dict, ConditionExpression: str | None = None) -> None:
        self.last_put_item = Item
        self.last_put_condition_expression = ConditionExpression
        item_key = self._item_key(Item)

        if (
            ConditionExpression is not None
            and ConditionExpression.startswith("attribute_not_exists(")
            and item_key in self.items
        ):
            raise self._conditional_failure()
        if (
            ConditionExpression is not None
            and ConditionExpression.startswith("attribute_exists(")
            and item_key not in self.items
        ):
            raise self._conditional_failure()

        self.items[item_key] = Item

    def get_item(self, Key: dict) -> dict:
        self.last_get_key = Key
        item_key = self._item_key(Key)
        if item_key in self.items:
            return {"Item": self.items[item_key]}
        return {}

    def scan(self, ExclusiveStartKey: dict | None = None) -> dict:
        return {"Items": list(self.items.values())}

    def delete_item(self, Key: dict, ConditionExpression: str | None = None) -> None:
        self.last_delete_key = Key
        self.last_delete_condition_expression = ConditionExpression
        item_key = self._item_key(Key)

        if (
            ConditionExpression is not None
            and ConditionExpression.startswith("attribute_exists(")
            and item_key not in self.items
        ):
            raise self._conditional_failure()

        self.items.pop(item_key, None)

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
        items = list(self.items.values())
        key_value = self._extract_key_condition_value(KeyConditionExpression)
        filtered_items = [
            item
            for item in items
            if item.get("testId") == key_value
            or item.get("sectionId") == key_value
            or item.get("questionSetId") == key_value
        ]
        if IndexName == "GSI1" and any("questionId" in item for item in filtered_items):
            sort_key_name = "questionId"
        else:
            sort_key_name = "version" if any("version" in item for item in filtered_items) else "displayOrder"
        filtered_items.sort(
            key=lambda item: item.get(sort_key_name, 0),
            reverse=not ScanIndexForward,
        )
        if Limit is not None:
            filtered_items = filtered_items[:Limit]
        return {"Items": filtered_items}

    def _item_key(self, item: dict) -> tuple[str, str]:
        if "sectionId" in item and "questionId" in item:
            return (item["sectionId"], item["questionId"])
        if "testId" in item and "version" in item and "SK" not in item:
            return (item["testId"], str(item["version"]))
        key_attribute = self._key_attribute(item)
        return (item[key_attribute], item.get("SK", "META"))

    def _key_attribute(self, item: dict) -> str:
        for attribute_name in ("questionId", "sectionId", "testId", "id"):
            if attribute_name in item:
                return attribute_name
        raise AssertionError("No supported key attribute found")

    def _conditional_failure(self) -> ClientError:
        return ClientError(
            error_response={"Error": {"Code": "ConditionalCheckFailedException"}},
            operation_name="PutItem",
        )

    def _extract_key_condition_value(self, expression) -> object:
        values = getattr(expression, "_values", ())
        if len(values) != 2:
            raise AssertionError("Unsupported key condition expression shape in fake table")
        return values[1]


class FakeDynamoClient:
    def __init__(self) -> None:
        self.table = FakeDynamoTable()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeDynamoTable:
        assert base_name == "tests"
        return self.table


class FakeDynamoClientForQuestions:
    def __init__(self) -> None:
        self.table = FakeDynamoTable()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeDynamoTable:
        assert base_name == "questions"
        return self.table


def build_entity() -> TestEntity:
    return TestEntity(
        id="test-1",
        name="Midterm",
        description="Sample test",
        status="draft",
        created_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
        updated_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
    )


def test_create_and_get_repository_item() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    entity = build_entity()

    created = repository.create(entity)
    fetched = repository.get(entity.id)
    stored_item = repository.table.items[("test-1", "META")]

    assert created == entity
    assert fetched.id == entity.id
    assert fetched.name == "Midterm"
    assert repository.table.last_get_key == {"testId": "test-1", "SK": "META"}
    assert stored_item == {
        "testId": "test-1",
        "SK": "META",
        "name": "Midterm",
        "description": "Sample test",
        "status": "draft",
        "created_at": "2026-07-16T00:00:00+00:00",
        "updated_at": "2026-07-16T00:00:00+00:00",
    }
    assert "id" not in stored_item


def test_list_repository_items() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    repository.create(build_entity())

    items = repository.list()

    assert len(items) == 1
    assert items[0].id == "test-1"


def test_update_repository_item() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    repository.create(build_entity())

    updated = repository.update(
        "test-1",
        TestEntity(
            id="ignored",
            name="Updated Midterm",
            description="Updated",
            status="published",
        ),
    )

    assert updated.id == "test-1"
    assert updated.name == "Updated Midterm"
    assert updated.created_at == datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    assert updated.updated_at >= updated.created_at
    assert repository.table.last_put_condition_expression == "attribute_exists(testId)"
    assert repository.table.last_put_item == {
        "testId": "test-1",
        "SK": "META",
        "name": "Updated Midterm",
        "description": "Updated",
        "status": "published",
        "created_at": "2026-07-16T00:00:00+00:00",
        "updated_at": updated.updated_at.isoformat(),
    }


def test_delete_repository_item() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    repository.create(build_entity())

    repository.delete("test-1")

    assert repository.table.last_delete_key == {"testId": "test-1", "SK": "META"}
    assert repository.table.last_delete_condition_expression == "attribute_exists(testId)"
    with pytest.raises(RepositoryNotFoundException):
        repository.get("test-1")


def test_create_duplicate_repository_item_raises_conflict() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    entity = build_entity()
    repository.create(entity)

    with pytest.raises(RepositoryConflictException):
        repository.create(entity)


def test_get_missing_repository_item_raises_not_found() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())

    with pytest.raises(RepositoryNotFoundException):
        repository.get("missing")


def test_dynamodb_decimal_values_are_converted_back() -> None:
    repository = TestRepository(dynamodb_client=FakeDynamoClient())
    repository.table.items[("test-1", "META")] = {
        "testId": "test-1",
        "SK": "META",
        "name": "Midterm",
        "description": "Sample test",
        "status": "draft",
        "created_at": "2026-07-16T00:00:00+00:00",
        "updated_at": "2026-07-16T00:00:00+00:00",
        "version": Decimal("1"),
    }

    fetched = repository.get("test-1")

    assert fetched.id == "test-1"


def test_section_repository_lists_by_test_id() -> None:
    repository = SectionRepository(dynamodb_client=FakeDynamoClientForSections())
    repository.create(
        SectionEntity(
            id="section-1",
            test_id="test-1",
            questionSetId="MOCK_SET_001",
            name="Math",
            description="Math basics",
            duration=30,
            display_order=2,
            status="draft",
        )
    )
    repository.create(
        SectionEntity(
            id="section-2",
            test_id="test-2",
            questionSetId="MOCK_SET_001",
            name="Science",
            description="Science basics",
            duration=40,
            display_order=1,
            status="draft",
        )
    )
    repository.create(
        SectionEntity(
            id="section-3",
            test_id="test-1",
            questionSetId="MOCK_SET_001",
            name="English",
            description="English basics",
            duration=35,
            display_order=1,
            status="published",
        )
    )

    items = repository.list_by_test_id("test-1")

    assert len(items) == 2
    assert [item.id for item in items] == ["section-3", "section-1"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI1"
    assert repository.table.items[("section-1", "META")]["displayOrder"] == "2"
    assert repository.table.items[("section-3", "META")]["displayOrder"] == "1"
    assert items[0].display_order == 1
    assert items[1].display_order == 2


def build_question_entity() -> QuestionEntity:
    return QuestionEntity(
        id="question-1",
        questionSetId="MOCK_SET_001",
        type="mcq",
        questionText="Which keyword creates a class in Java?",
        options=["class", "new", "object", "static"],
        correctAnswer="class",
        difficulty="easy",
        category="java",
        marks=1,
        negativeMarks=0,
        status="active",
        created_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
        updated_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
    )


def test_question_repository_create_and_get_item() -> None:
    repository = QuestionRepository(dynamodb_client=FakeDynamoClientForQuestions())
    entity = build_question_entity()

    created = repository.create(entity)
    fetched = repository.get(entity.id)
    stored_item = repository.table.items[("question-1", "META")]

    assert created == entity
    assert fetched.id == "question-1"
    assert fetched.question_text == "Which keyword creates a class in Java?"
    assert repository.table.last_get_key == {"questionId": "question-1", "SK": "META"}
    assert stored_item == {
        "questionId": "question-1",
        "SK": "META",
        "questionSetId": "MOCK_SET_001",
        "type": "mcq",
        "questionText": "Which keyword creates a class in Java?",
        "options": ["class", "new", "object", "static"],
        "correctAnswer": "class",
        "difficulty": "easy",
        "category": "java",
        "marks": 1,
        "negativeMarks": 0,
        "status": "active",
        "created_at": "2026-07-16T00:00:00+00:00",
        "updated_at": "2026-07-16T00:00:00+00:00",
    }
    assert "id" not in stored_item


def test_question_repository_update_preserves_created_at() -> None:
    repository = QuestionRepository(dynamodb_client=FakeDynamoClientForQuestions())
    repository.create(build_question_entity())

    updated = repository.update(
        "question-1",
        QuestionEntity(
            id="ignored",
            questionSetId="MOCK_SET_001",
            type="mcq",
            questionText="Updated question?",
            options=["A", "B"],
            correctAnswer="A",
            difficulty="medium",
            category="java",
            marks=2,
            negativeMarks=1,
            status="draft",
        ),
    )

    assert updated.id == "question-1"
    assert updated.created_at == datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    assert updated.updated_at >= updated.created_at
    assert repository.table.last_put_condition_expression == "attribute_exists(questionId)"
    assert repository.table.last_put_item["questionId"] == "question-1"
    assert repository.table.last_put_item["SK"] == "META"
    assert repository.table.last_put_item["questionSetId"] == "MOCK_SET_001"
    assert repository.table.last_put_item["created_at"] == "2026-07-16T00:00:00+00:00"


def test_question_repository_delete_uses_question_id_key() -> None:
    repository = QuestionRepository(dynamodb_client=FakeDynamoClientForQuestions())
    repository.create(build_question_entity())

    repository.delete("question-1")

    assert repository.table.last_delete_key == {"questionId": "question-1", "SK": "META"}
    assert repository.table.last_delete_condition_expression == "attribute_exists(questionId)"
    with pytest.raises(RepositoryNotFoundException):
        repository.get("question-1")


def test_question_repository_lists_by_question_set_id() -> None:
    repository = QuestionRepository(dynamodb_client=FakeDynamoClientForQuestions())
    repository.create(build_question_entity())
    repository.create(
        QuestionEntity(
            id="question-2",
            questionSetId="MOCK_SET_001",
            type="mcq",
            questionText="What is JRE?",
            options=["Java Runtime Environment", "Java Resource Engine"],
            correctAnswer="Java Runtime Environment",
            difficulty="easy",
            category="java",
            marks=1,
            negativeMarks=0,
            status="active",
            created_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
            updated_at=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
        ),
    )

    items = repository.list_by_question_set_id("MOCK_SET_001")

    assert len(items) == 2
    assert [item.id for item in items] == ["question-1", "question-2"]
    assert repository.table.last_query_kwargs["IndexName"] == "GSI1"


class FakeDynamoTableWithFilter(FakeDynamoTable):
    def scan(
        self,
        ExclusiveStartKey: dict | None = None,
        FilterExpression=None,
    ) -> dict:
        items = list(self.items.values())
        if FilterExpression is None:
            return {"Items": items}
        attribute_name, expected_value = self._extract_filter_components(FilterExpression)
        return {
            "Items": [
                item
                for item in items
                if item.get(attribute_name) == expected_value
            ]
        }

    def _extract_filter_components(self, expression) -> tuple[str, object]:
        values = getattr(expression, "_values", ())
        if len(values) != 2:
            raise AssertionError("Unsupported filter expression shape in fake table")
        attribute = values[0]
        attribute_name = getattr(attribute, "name", None)
        if attribute_name is None:
            raise AssertionError("Unsupported attribute expression in fake table")
        return attribute_name, values[1]


class FakeDynamoClientForSections:
    def __init__(self) -> None:
        self.table = FakeDynamoTableWithFilter()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeDynamoTableWithFilter:
        assert base_name == "sections"
        return self.table
