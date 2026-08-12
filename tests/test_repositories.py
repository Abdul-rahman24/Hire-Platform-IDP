from datetime import UTC, datetime
from typing import Any
import pytest

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.models.test import TestEntity
from app.repositories.interfaces import TestRepositoryInterface


class FakeRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self) -> None:
        self.items: dict[str, TestEntity] = {}

    def create(self, entity: TestEntity) -> TestEntity:
        if entity.id in self.items:
            raise RepositoryConflictException(f"Entity '{entity.id}' already exists")
        self.items[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> TestEntity:
        if entity_id not in self.items:
            raise RepositoryNotFoundException(f"Entity '{entity_id}' was not found")
        return self.items[entity_id]

    def list(self) -> list[TestEntity]:
        return list(self.items.values())

    def update(self, entity_id: str, entity: TestEntity) -> TestEntity:
        if entity_id not in self.items:
            raise RepositoryNotFoundException(f"Entity '{entity_id}' was not found")
        self.items[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        if entity_id not in self.items:
            raise RepositoryNotFoundException(f"Entity '{entity_id}' was not found")
        del self.items[entity_id]


def test_create_and_get_repository_item() -> None:
    repo = FakeRepository()
    entity = TestEntity(
        id="TEST-100",
        title="Sample Exam",
        duration_minutes=60,
        total_marks=50,
        question_set_id="SET001",
    )
    repo.create(entity)
    fetched = repo.get("TEST-100")
    assert fetched.title == "Sample Exam"


def test_list_repository_items() -> None:
    repo = FakeRepository()
    entity = TestEntity(
        id="TEST-101",
        title="Sample Exam 2",
        duration_minutes=60,
        total_marks=50,
        question_set_id="SET001",
    )
    repo.create(entity)
    assert len(repo.list()) == 1


def test_update_repository_item() -> None:
    repo = FakeRepository()
    entity = TestEntity(
        id="TEST-102",
        title="Sample Exam 3",
        duration_minutes=60,
        total_marks=50,
        question_set_id="SET001",
    )
    repo.create(entity)
    updated = TestEntity(
        id="TEST-102",
        title="Updated Exam 3",
        duration_minutes=90,
        total_marks=100,
        question_set_id="SET001",
    )
    repo.update("TEST-102", updated)
    assert repo.get("TEST-102").title == "Updated Exam 3"


def test_delete_repository_item() -> None:
    repo = FakeRepository()
    entity = TestEntity(
        id="TEST-103",
        title="Sample Exam 4",
        duration_minutes=60,
        total_marks=50,
        question_set_id="SET001",
    )
    repo.create(entity)
    repo.delete("TEST-103")
    with pytest.raises(RepositoryNotFoundException):
        repo.get("TEST-103")


def test_create_duplicate_repository_item_raises_conflict() -> None:
    repo = FakeRepository()
    entity = TestEntity(
        id="TEST-104",
        title="Sample Exam 5",
        duration_minutes=60,
        total_marks=50,
        question_set_id="SET001",
    )
    repo.create(entity)
    with pytest.raises(RepositoryConflictException):
        repo.create(entity)


def test_get_missing_repository_item_raises_not_found() -> None:
    repo = FakeRepository()
    with pytest.raises(RepositoryNotFoundException):
        repo.get("NON-EXISTENT")
