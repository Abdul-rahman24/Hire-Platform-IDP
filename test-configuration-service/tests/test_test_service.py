from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryNotFoundException, ServiceException
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.test import TestCreateRequest, TestUpdateRequest
from app.services.test_service import TestService
from app.utils.question_bank_client import QuestionBankClient


class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        base_entity = TestEntity(
            id="test-1",
            name="Midterm",
            description="Sample test",
            status="draft",
            created_at=timestamp,
            updated_at=timestamp,
        )
        self.entities = {
            "test-1": base_entity.model_copy(update={"instructions": "Read all questions carefully.", "duration": 60})
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
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("TestEntity not found")
        current = self.entities[entity_id]
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
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("TestEntity not found")
        del self.entities[entity_id]


class FakeSectionRepository(SectionRepositoryInterface[SectionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = [
            SectionEntity(
                id="section-1",
                test_id="test-1",
                questionSetId="MOCK_SET_001",
                section_name="Math",
                duration=30,
                shuffle_questions=True,
                created_at=timestamp,
                updated_at=timestamp,
            )
        ]

    def create(self, entity: SectionEntity) -> SectionEntity:
        self.entities.append(entity)
        return entity

    def get(self, entity_id: str) -> SectionEntity:
        for entity in self.entities:
            if entity.id == entity_id:
                return entity
        raise RepositoryNotFoundException("SectionEntity not found")

    def list(self) -> list[SectionEntity]:
        return self.entities

    def list_by_test_id(self, test_id: str) -> list[SectionEntity]:
        return [entity for entity in self.entities if entity.test_id == test_id]

    def update(self, entity_id: str, entity: SectionEntity) -> SectionEntity:
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities = [entity for entity in self.entities if entity.id != entity_id]


class FakeMappingRepository(
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self) -> None:
        self.entities = [
            SectionQuestionMappingEntity(
                id="section-1#question-1",
                section_id="section-1",
                question_id="question-1",
                display_order=1,
                marks=2,
                negative_marks=0,
                is_mandatory=True,
            ),
            SectionQuestionMappingEntity(
                id="section-1#question-2",
                section_id="section-1",
                question_id="question-2",
                display_order=2,
                marks=3,
                negative_marks=1,
                is_mandatory=False,
            )
        ]

    def create(
        self,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities.append(entity)
        return entity

    def get(self, entity_id: str) -> SectionQuestionMappingEntity:
        for entity in self.entities:
            if entity.id == entity_id:
                return entity
        raise RepositoryNotFoundException("Mapping not found")

    def get_mapping(self, section_id: str, question_id: str) -> SectionQuestionMappingEntity:
        for entity in self.entities:
            if entity.section_id == section_id and entity.question_id == question_id:
                return entity
        raise RepositoryNotFoundException("Mapping not found")

    def delete_by_section_id(self, section_id: str) -> None:
        matches = [entity for entity in self.entities if entity.section_id == section_id]
        if not matches:
            raise RepositoryNotFoundException("Mapping not found")
        self.entities = [entity for entity in self.entities if entity.section_id != section_id]

    def list_by_section_id(self, section_id: str) -> list[SectionQuestionMappingEntity]:
        return [entity for entity in self.entities if entity.section_id == section_id]

    def list(self) -> list[SectionQuestionMappingEntity]:
        return self.entities

    def update(
        self,
        entity_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        return entity

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities = [entity for entity in self.entities if entity.id != entity_id]

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        entity = self.get_mapping(section_id, question_id)
        self.delete(entity.id)

class FakeQuestionRepository(QuestionRepositoryInterface[QuestionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "question-1": QuestionEntity(
                id="question-1",
                questionSetId="MOCK_SET_001",
                type="mcq",
                questionText="What is JVM?",
                options=[
                    "Java Virtual Machine",
                    "Java Variable Method",
                    "Java Version Manager",
                    "Java Virtual Memory",
                ],
                correctAnswer="Java Virtual Machine",
                difficulty="easy",
                category="java",
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
                questionText="What is JRE?",
                options=[
                    "Java Runtime Environment",
                    "Java Resource Engine",
                ],
                correctAnswer="Java Runtime Environment",
                difficulty="medium",
                category="java",
                marks=3,
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
        self.entities[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        self.entities.pop(entity_id, None)


def test_create_test_returns_response_model() -> None:
    service = TestService(repository=FakeTestRepository())

    result = service.create_test(
        TestCreateRequest(
            name="Final Exam",
            description="Term end test",
            status="draft",
        )
    )

    assert result.name == "Final Exam"
    assert result.status == "draft"
    assert result.id


def test_list_tests_returns_items() -> None:
    service = TestService(repository=FakeTestRepository())

    items = service.list_tests()

    assert len(items) == 1
    assert items[0].id == "test-1"


def test_update_test_preserves_existing_identity() -> None:
    service = TestService(repository=FakeTestRepository())

    result = service.update_test(
        "test-1",
        TestUpdateRequest(
            name="Updated Midterm",
            description="Updated description",
            status="published",
        ),
    )

    assert result.id == "test-1"
    assert result.name == "Updated Midterm"
    assert result.status == "published"


def test_delete_missing_test_raises_not_found() -> None:
    service = TestService(
        repository=FakeTestRepository(),
        section_repository=FakeSectionRepository(),
        mapping_repository=FakeMappingRepository(),
    )

    with pytest.raises(RepositoryNotFoundException):
        service.delete_test("missing")


def test_delete_test_cascades_sections_and_question_mappings() -> None:
    test_repository = FakeTestRepository()
    section_repository = FakeSectionRepository()
    mapping_repository = FakeMappingRepository()
    service = TestService(
        repository=test_repository,
        section_repository=section_repository,
        mapping_repository=mapping_repository,
    )

    service.delete_test("test-1")

    assert "test-1" not in test_repository.entities
    assert section_repository.list_by_test_id("test-1") == []
    with pytest.raises(RepositoryNotFoundException):
        mapping_repository.delete_by_section_id("section-1")


def test_get_complete_test_returns_nested_sections_and_questions() -> None:
    service = TestService(
        repository=FakeTestRepository(),
        section_repository=FakeSectionRepository(),
        mapping_repository=FakeMappingRepository(),
    )

    result = service.get_complete_test("test-1")

    assert result.id == "test-1"
    assert len(result.sections) == 1
    assert result.sections[0].section_id == "section-1"
    assert result.sections[0].duration == 30
    assert result.sections[0].shuffle_questions is True
    assert result.sections[0].question_set_id == "MOCK_SET_001"
    assert result.sections[0].question_ids == ["question-1", "question-2"]


def test_get_full_test_returns_nested_student_payload() -> None:
    service = TestService(
        repository=FakeTestRepository(),
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    result = service.get_full_test("test-1")

    assert result.test_id == "test-1"
    assert result.test_name == "Midterm"
    assert result.instructions == "Read all questions carefully."
    assert result.duration == 60
    assert len(result.sections) == 1
    assert result.sections[0].section_id == "section-1"
    assert result.sections[0].question_set_id == "MOCK_SET_001"
    assert result.sections[0].question_set_name == "Mock Question Set"
    assert [question.question_id for question in result.sections[0].questions] == [
        "question-1",
        "question-2",
    ]
    assert result.sections[0].questions[0].options[0].option_id == "A"
    assert result.sections[0].questions[0].options[0].text == "Java Virtual Machine"


def test_get_full_test_raises_when_question_set_is_not_available_in_mock() -> None:
    section_repository = FakeSectionRepository()
    section_repository.entities[0] = section_repository.entities[0].model_copy(
        update={"question_set_id": "UNKNOWN_SET"},
    )
    service = TestService(
        repository=FakeTestRepository(),
        section_repository=section_repository,
        question_repository=FakeQuestionRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    with pytest.raises(ServiceException, match="Question set 'UNKNOWN_SET' is not available in the MVP mock"):
        service.get_full_test("test-1")
