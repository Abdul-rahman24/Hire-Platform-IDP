from __future__ import annotations

from datetime import UTC, datetime

import pytest
from botocore.exceptions import ClientError

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.models.published_test import PublishedQuestionSnapshot, PublishedSectionSnapshot, PublishedTestEntity
from app.repositories.published_test_repository import PublishedTestRepository
from tests.test_repositories import FakeDynamoTable


class FakeTransactClient:
    def __init__(self, published_table: FakeDynamoTable, tests_table: FakeDynamoTable) -> None:
        self.published_table = published_table
        self.tests_table = tests_table

    def transact_write_items(self, TransactItems: list[dict]) -> dict:
        put_item = TransactItems[0]["Put"]
        update_item = TransactItems[1]["Update"]

        published = self._normalize_item(put_item["Item"])
        published_key = (published["testId"], published["version"])
        if published_key in self.published_table.items:
            raise ClientError(
                {"Error": {"Code": "TransactionCanceledException"}},
                "TransactWriteItems",
            )

        test_key = self._normalize_item(update_item["Key"])
        test_item = self.tests_table.items.get((test_key["testId"], test_key["SK"]))
        values = self._normalize_item(update_item["ExpressionAttributeValues"])
        if test_item is None or test_item["status"] != values[":draft"]:
            raise ClientError(
                {"Error": {"Code": "TransactionCanceledException"}},
                "TransactWriteItems",
            )

        self.published_table.items[published_key] = published
        self.tests_table.items[(test_key["testId"], test_key["SK"])] = {
            **test_item,
            "status": values[":published"],
            "updated_at": values[":updated_at"],
        }
        return {"ResponseMetadata": {"RetryAttempts": 0}}

    def _normalize_item(self, item: dict) -> dict:
        if item and all(isinstance(value, dict) for value in item.values()):
            first_value = next(iter(item.values()))
            if {"S", "N", "BOOL", "L", "M"} & set(first_value.keys()):
                return self._deserialize_item(item)
        return item

    def _deserialize_item(self, item: dict) -> dict:
        result = {}
        for key, value in item.items():
            if "S" in value:
                result[key] = value["S"]
            elif "N" in value:
                number = value["N"]
                result[key] = int(number) if "." not in number else float(number)
            elif "BOOL" in value:
                result[key] = value["BOOL"]
            elif "L" in value:
                result[key] = [self._deserialize_item({"v": entry})["v"] for entry in value["L"]]
            elif "M" in value:
                result[key] = self._deserialize_item(value["M"])
        return result


class FakeResourceMeta:
    def __init__(self, client: FakeTransactClient) -> None:
        self.client = client


class FakeResource:
    def __init__(self, client: FakeTransactClient) -> None:
        self.meta = FakeResourceMeta(client)


class FakeDynamoClientForPublishedTests:
    def __init__(self) -> None:
        self.published_table = FakeDynamoTable()
        self.published_table.name = "test-config-published-tests"
        self.tests_table = FakeDynamoTable()
        self.tests_table.name = "test-config-tests"
        self.tests_table.items[("test-1", "META")] = {
            "testId": "test-1",
            "SK": "META",
            "name": "Midterm",
            "description": "Sample test",
            "status": "draft",
            "created_at": "2026-07-16T00:00:00+00:00",
            "updated_at": "2026-07-16T00:00:00+00:00",
        }
        self.region_name = "test-region"
        self.resource = FakeResource(FakeTransactClient(self.published_table, self.tests_table))

    def get_table(self, base_name: str) -> FakeDynamoTable:
        if base_name == "published-tests":
            return self.published_table
        if base_name == "tests":
            return self.tests_table
        raise AssertionError(f"Unexpected table {base_name}")

    def table_name(self, base_name: str) -> str:
        return f"test-config-{base_name}"


def build_snapshot(version: int = 1) -> PublishedTestEntity:
    return PublishedTestEntity(
        testId="test-1",
        version=version,
        publishedAt=datetime(2026, 7, 16, 1, 0, tzinfo=UTC),
        name="Midterm",
        description="Sample test",
        status="published",
        sections=[
            PublishedSectionSnapshot(
                sectionId="section-1",
                name="Math",
                duration=30,
                displayOrder=1,
                questions=[
                    PublishedQuestionSnapshot(
                        questionId="question-1",
                        questionText="What is 2 + 2?",
                        options=["3", "4"],
                        correctAnswer="4",
                        marks=2,
                        negativeMarks=0,
                        displayOrder=1,
                    )
                ],
            )
        ],
    )


def test_publish_repository_stores_snapshot_and_updates_test_status() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())

    stored = repository.publish_snapshot(build_snapshot())

    assert stored.version == 1
    assert repository.get_latest("test-1").version == 1
    assert repository.dynamodb_client.tests_table.items[("test-1", "META")]["status"] == "published"


def test_publish_repository_gets_specific_version() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())
    repository.create(build_snapshot(version=1))
    repository.create(build_snapshot(version=2))

    fetched = repository.get_version("test-1", 2)

    assert fetched.version == 2


def test_publish_repository_get_latest_returns_highest_version() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())
    repository.create(build_snapshot(version=1))
    repository.create(build_snapshot(version=3))
    repository.create(build_snapshot(version=2))

    fetched = repository.get_latest("test-1")

    assert fetched.version == 3


def test_publish_repository_version_increment_supports_immutable_snapshots() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())
    repository.create(build_snapshot(version=1))
    repository.create(build_snapshot(version=2))

    assert repository.get_latest_version_number("test-1") == 2
    assert repository.get_version("test-1", 1).sections[0].questions[0].question_text == "What is 2 + 2?"


def test_publish_repository_duplicate_version_raises_conflict() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())
    repository.create(build_snapshot(version=1))

    with pytest.raises(RepositoryConflictException):
        repository.create(build_snapshot(version=1))


def test_publish_repository_get_missing_version_raises_not_found() -> None:
    repository = PublishedTestRepository(dynamodb_client=FakeDynamoClientForPublishedTests())

    with pytest.raises(RepositoryNotFoundException):
        repository.get_version("test-1", 99)
