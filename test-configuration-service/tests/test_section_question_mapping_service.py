from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.repositories.interfaces import (
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
)
from app.schemas.section_question_mapping import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingUpdateRequest,
)
from app.services.section_question_mapping_service import SectionQuestionMappingService


class FakeSectionRepository(SectionRepositoryInterface[SectionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "section-1": SectionEntity(
                id="section-1",
                test_id="test-1",
                name="Math",
                description="Math basics",
                duration=30,
                display_order=1,
                status="draft",
                created_at=timestamp,
                updated_at=timestamp,
            )
        }

    def create(self, entity: SectionEntity) -> SectionEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> SectionEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("SectionEntity not found")
        return entity

    def list(self) -> list[SectionEntity]:
        return list(self.entities.values())

    def list_by_test_id(self, test_id: str) -> list[SectionEntity]:
        return [entity for entity in self.entities.values() if entity.test_id == test_id]

    def update(self, entity_id: str, entity: SectionEntity) -> SectionEntity:
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)


class FakeQuestionRepository(QuestionRepositoryInterface[QuestionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "question-1": QuestionEntity(
                id="question-1",
                questionSetId="MOCK_SET_001",
                type="mcq",
                questionText="What is 2 + 2?",
                options=["3", "4"],
                correctAnswer="4",
                difficulty="easy",
                category="math",
                marks=2,
                negativeMarks=0,
                status="active",
                created_at=timestamp,
                updated_at=timestamp,
            ),
            "question-2": QuestionEntity(
                id="question-2",
                questionSetId="MOCK_SET_001",
                type="mcq",
                questionText="What is 3 + 3?",
                options=["5", "6"],
                correctAnswer="6",
                difficulty="easy",
                category="math",
                marks=2,
                negativeMarks=0,
                status="active",
                created_at=timestamp,
                updated_at=timestamp,
            ),
        }

    def create(self, entity: QuestionEntity) -> QuestionEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> QuestionEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("QuestionEntity not found")
        return entity

    def list(self) -> list[QuestionEntity]:
        return list(self.entities.values())

    def list_by_question_set_id(self, question_set_id: str) -> list[QuestionEntity]:
        return [
            entity
            for entity in self.entities.values()
            if entity.question_set_id == question_set_id
        ]

    def update(self, entity_id: str, entity: QuestionEntity) -> QuestionEntity:
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)


class FakeMappingRepository(
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self) -> None:
        self.entities: dict[tuple[str, str], SectionQuestionMappingEntity] = {}

    def create(self, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingEntity:
        self.entities[(entity.section_id, entity.question_id)] = entity
        return entity

    def get(self, entity_id: str) -> SectionQuestionMappingEntity:
        section_id, question_id = entity_id.split("#", 1)
        return self.get_mapping(section_id, question_id)

    def get_mapping(self, section_id: str, question_id: str) -> SectionQuestionMappingEntity:
        entity = self.entities.get((section_id, question_id))
        if entity is None:
            raise RepositoryNotFoundException("Mapping not found")
        return entity

    def delete_by_section_id(self, section_id: str) -> None:
        matches = [key for key in self.entities if key[0] == section_id]
        if not matches:
            raise RepositoryNotFoundException("Mapping not found")
        for key in matches:
            del self.entities[key]

    def list_by_section_id(self, section_id: str) -> list[SectionQuestionMappingEntity]:
        return sorted(
            [entity for (entity_section_id, _), entity in self.entities.items() if entity_section_id == section_id],
            key=lambda entity: (entity.display_order, entity.question_id),
        )

    def list(self) -> list[SectionQuestionMappingEntity]:
        return list(self.entities.values())

    def update(self, entity_id: str, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingEntity:
        self.entities[(entity.section_id, entity.question_id)] = entity
        return entity

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities[(section_id, question_id)] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        section_id, question_id = entity_id.split("#", 1)
        self.delete_mapping(section_id, question_id)

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        if (section_id, question_id) not in self.entities:
            raise RepositoryNotFoundException("Mapping not found")
        del self.entities[(section_id, question_id)]


def test_create_mapping_returns_response() -> None:
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=FakeMappingRepository(),
    )

    result = service.create_mapping(
        "section-1",
        SectionQuestionMappingCreateRequest(
            questionId="question-1",
            displayOrder=1,
            marks=2,
            negativeMarks=0,
            isMandatory=True,
        ),
    )

    assert result.section_id == "section-1"
    assert result.question_id == "question-1"
    assert result.display_order == 1


def test_create_mapping_rejects_duplicate_mapping() -> None:
    repository = FakeMappingRepository()
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-1",
            section_id="section-1",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
        )
    )
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=repository,
    )

    with pytest.raises(RepositoryConflictException):
        service.create_mapping(
            "section-1",
            SectionQuestionMappingCreateRequest(
                questionId="question-1",
                displayOrder=1,
                marks=2,
                negativeMarks=0,
                isMandatory=True,
            ),
        )


def test_create_mapping_raises_not_found_for_missing_section() -> None:
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=FakeMappingRepository(),
    )

    with pytest.raises(RepositoryNotFoundException):
        service.create_mapping(
            "missing-section",
            SectionQuestionMappingCreateRequest(
                questionId="question-1",
                displayOrder=1,
                marks=2,
                negativeMarks=0,
                isMandatory=True,
            ),
        )


def test_create_mapping_raises_not_found_for_missing_question() -> None:
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=FakeMappingRepository(),
    )

    with pytest.raises(RepositoryNotFoundException):
        service.create_mapping(
            "section-1",
            SectionQuestionMappingCreateRequest(
                questionId="missing-question",
                displayOrder=1,
                marks=2,
                negativeMarks=0,
                isMandatory=True,
            ),
        )


def test_list_mappings_returns_display_ordered_items() -> None:
    repository = FakeMappingRepository()
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-2",
            section_id="section-1",
            question_id="question-2",
            display_order=2,
            marks=2,
            negative_marks=0,
            is_mandatory=False,
        )
    )
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-1",
            section_id="section-1",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
        )
    )
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=repository,
    )

    result = service.list_section_questions("section-1")

    assert [item.question_id for item in result] == ["question-1", "question-2"]


def test_get_mapping_returns_existing_mapping() -> None:
    repository = FakeMappingRepository()
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-1",
            section_id="section-1",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
        )
    )
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=repository,
    )

    result = service.get_mapping("section-1", "question-1")

    assert result.question_id == "question-1"
    assert result.section_id == "section-1"


def test_update_mapping_preserves_identity() -> None:
    timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    repository = FakeMappingRepository()
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-1",
            section_id="section-1",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
            created_at=timestamp,
            updated_at=timestamp,
        )
    )
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=repository,
    )

    result = service.update_mapping(
        "section-1",
        "question-1",
        SectionQuestionMappingUpdateRequest(
            displayOrder=3,
            marks=5,
            negativeMarks=1,
            isMandatory=False,
        ),
    )

    assert result.section_id == "section-1"
    assert result.question_id == "question-1"
    assert result.display_order == 3
    assert result.created_at == timestamp
    assert result.updated_at >= timestamp


def test_delete_mapping_then_get_returns_not_found() -> None:
    repository = FakeMappingRepository()
    repository.create(
        SectionQuestionMappingEntity(
            id="section-1#question-1",
            section_id="section-1",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
        )
    )
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=repository,
    )

    service.delete_mapping("section-1", "question-1")

    with pytest.raises(RepositoryNotFoundException):
        service.get_mapping("section-1", "question-1")
