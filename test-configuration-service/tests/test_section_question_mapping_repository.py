from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.repositories.section_question_mapping_repository import SectionQuestionMappingRepository
from tests.test_repositories import FakeDynamoTable


class FakeDynamoClientForSectionQuestionMappings:
    def __init__(self) -> None:
        self.table = FakeDynamoTable()
        self.region_name = "test-region"

    def get_table(self, base_name: str) -> FakeDynamoTable:
        assert base_name == "section-question-mapping"
        return self.table


def build_mapping_entity(
    section_id: str = "section-1",
    question_id: str = "question-1",
    display_order: int = 1,
) -> SectionQuestionMappingEntity:
    timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    return SectionQuestionMappingEntity(
        id=f"{section_id}#{question_id}",
        section_id=section_id,
        question_id=question_id,
        display_order=display_order,
        marks=2,
        negative_marks=0,
        is_mandatory=True,
        created_at=timestamp,
        updated_at=timestamp,
    )


def test_create_and_get_mapping_repository_item() -> None:
    repository = SectionQuestionMappingRepository(
        dynamodb_client=FakeDynamoClientForSectionQuestionMappings()
    )
    entity = build_mapping_entity()

    created = repository.create(entity)
    fetched = repository.get_mapping("section-1", "question-1")
    stored_item = repository.table.items[("section-1", "question-1")]

    assert created.section_id == entity.section_id
    assert fetched.question_id == "question-1"
    assert repository.table.last_get_key == {"sectionId": "section-1", "questionId": "question-1"}
    assert stored_item == {
        "sectionId": "section-1",
        "questionId": "question-1",
        "displayOrder": 1,
        "marks": 2,
        "negativeMarks": 0,
        "isMandatory": True,
        "created_at": "2026-07-16T00:00:00+00:00",
        "updated_at": "2026-07-16T00:00:00+00:00",
    }


def test_create_duplicate_mapping_raises_conflict() -> None:
    repository = SectionQuestionMappingRepository(
        dynamodb_client=FakeDynamoClientForSectionQuestionMappings()
    )
    entity = build_mapping_entity()
    repository.create(entity)

    with pytest.raises(RepositoryConflictException):
        repository.create(entity)


def test_list_by_section_id_returns_display_ordered_items() -> None:
    repository = SectionQuestionMappingRepository(
        dynamodb_client=FakeDynamoClientForSectionQuestionMappings()
    )
    repository.create(build_mapping_entity(question_id="question-2", display_order=2))
    repository.create(build_mapping_entity(question_id="question-1", display_order=1))

    items = repository.list_by_section_id("section-1")

    assert [item.question_id for item in items] == ["question-1", "question-2"]


def test_update_mapping_preserves_created_at() -> None:
    repository = SectionQuestionMappingRepository(
        dynamodb_client=FakeDynamoClientForSectionQuestionMappings()
    )
    repository.create(build_mapping_entity())

    updated = repository.update_mapping(
        "section-1",
        "question-1",
        SectionQuestionMappingEntity(
            id="ignored",
            section_id="section-ignored",
            question_id="question-ignored",
            display_order=3,
            marks=5,
            negative_marks=1,
            is_mandatory=False,
        ),
    )

    assert updated.section_id == "section-1"
    assert updated.question_id == "question-1"
    assert updated.created_at == datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    assert updated.updated_at >= updated.created_at
    assert repository.table.last_put_item["sectionId"] == "section-1"
    assert repository.table.last_put_item["questionId"] == "question-1"


def test_delete_mapping_then_get_raises_not_found() -> None:
    repository = SectionQuestionMappingRepository(
        dynamodb_client=FakeDynamoClientForSectionQuestionMappings()
    )
    repository.create(build_mapping_entity())

    repository.delete_mapping("section-1", "question-1")

    with pytest.raises(RepositoryNotFoundException):
        repository.get_mapping("section-1", "question-1")
