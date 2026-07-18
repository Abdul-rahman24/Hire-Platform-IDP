from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryNotFoundException, ServiceException
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.section import SectionCreateRequest, SectionUpdateRequest
from app.services.section_service import SectionService
from app.utils.question_bank_client import QuestionBankClient


class FakeSectionRepository(SectionRepositoryInterface[SectionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "section-1": SectionEntity(
                id="section-1",
                test_id="test-1",
                questionSetId="MOCK_SET_001",
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
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("SectionEntity not found")
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
            raise RepositoryNotFoundException("SectionEntity not found")
        del self.entities[entity_id]


class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self, exists: bool = True) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {}
        if exists:
            self.entities["test-1"] = TestEntity(
                id="test-1",
                name="Midterm",
                description="Sample test",
                status="draft",
                created_at=timestamp,
                updated_at=timestamp,
            )

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
        self.entities[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("TestEntity not found")
        del self.entities[entity_id]


class FakeMappingRepository(
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self) -> None:
        self.entities = {
            "section-1#question-1": SectionQuestionMappingEntity(
                id="section-1#question-1",
                section_id="section-1",
                question_id="question-1",
                display_order=1,
                marks=2,
                negative_marks=0,
                is_mandatory=True,
            )
        }

    def create(
        self,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> SectionQuestionMappingEntity:
        entity = self.entities.get(entity_id)
        if entity is None:
            raise RepositoryNotFoundException("Mapping not found")
        return entity

    def get_mapping(self, section_id: str, question_id: str) -> SectionQuestionMappingEntity:
        for entity in self.entities.values():
            if entity.section_id == section_id and entity.question_id == question_id:
                return entity
        raise RepositoryNotFoundException("Mapping not found")

    def delete_by_section_id(self, section_id: str) -> None:
        entity_ids = [
            entity_id
            for entity_id, entity in self.entities.items()
            if entity.section_id == section_id
        ]
        if not entity_ids:
            raise RepositoryNotFoundException("Mapping not found")
        for entity_id in entity_ids:
            del self.entities[entity_id]

    def list_by_section_id(self, section_id: str) -> list[SectionQuestionMappingEntity]:
        return [
            entity
            for entity in self.entities.values()
            if entity.section_id == section_id
        ]

    def list(self) -> list[SectionQuestionMappingEntity]:
        return list(self.entities.values())

    def update(
        self,
        entity_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities[entity_id] = entity
        return entity

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities[f"{section_id}#{question_id}"] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("Mapping not found")
        del self.entities[entity_id]

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        self.delete(f"{section_id}#{question_id}")


def test_create_section_returns_response_model() -> None:
    service = SectionService(
        repository=FakeSectionRepository(),
        test_repository=FakeTestRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    result = service.create_section(
        "test-1",
        SectionCreateRequest(
            questionSetId="MOCK_SET_001",
            name="Science",
            description="Science basics",
            duration=45,
            displayOrder=2,
            status="draft",
        ),
    )

    assert result.test_id == "test-1"
    assert result.question_set_id == "MOCK_SET_001"
    assert result.name == "Science"
    assert result.description == "Science basics"
    assert result.display_order == 2
    assert result.status == "draft"


def test_create_section_raises_not_found_when_parent_test_is_missing() -> None:
    section_repository = FakeSectionRepository()
    service = SectionService(
        repository=section_repository,
        test_repository=FakeTestRepository(exists=False),
        question_bank_provider=QuestionBankClient(),
    )

    with pytest.raises(RepositoryNotFoundException):
        service.create_section(
            "missing-test",
            SectionCreateRequest(
                questionSetId="MOCK_SET_001",
                name="Science",
                description="Science basics",
                duration=45,
                displayOrder=2,
                status="draft",
            ),
        )

    assert len(section_repository.entities) == 1


def test_list_sections_filters_by_test_id() -> None:
    service = SectionService(repository=FakeSectionRepository())

    items = service.list_sections("test-1")

    assert len(items) == 1
    assert items[0].test_id == "test-1"


def test_get_section_returns_item() -> None:
    service = SectionService(repository=FakeSectionRepository())

    result = service.get_section("section-1")

    assert result.id == "section-1"
    assert result.name == "Math"
    assert result.display_order == 1


def test_update_section_preserves_parent_test() -> None:
    service = SectionService(
        repository=FakeSectionRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    result = service.update_section(
        "section-1",
        SectionUpdateRequest(
            questionSetId="MOCK_SET_001",
            name="Updated Math",
            description="Updated math basics",
            duration=50,
            displayOrder=3,
            status="published",
        ),
    )

    assert result.id == "section-1"
    assert result.test_id == "test-1"
    assert result.question_set_id == "MOCK_SET_001"
    assert result.name == "Updated Math"
    assert result.description == "Updated math basics"
    assert result.display_order == 3
    assert result.status == "published"


def test_delete_missing_section_raises_not_found() -> None:
    service = SectionService(repository=FakeSectionRepository())

    with pytest.raises(RepositoryNotFoundException):
        service.delete_section("missing")


def test_delete_section_cascades_question_mapping() -> None:
    section_repository = FakeSectionRepository()
    mapping_repository = FakeMappingRepository()
    service = SectionService(
        repository=section_repository,
        mapping_repository=mapping_repository,
    )

    service.delete_section("section-1")

    with pytest.raises(RepositoryNotFoundException):
        section_repository.get("section-1")
    with pytest.raises(RepositoryNotFoundException):
        mapping_repository.delete_by_section_id("section-1")


def test_create_section_rejects_unknown_question_set_id() -> None:
    service = SectionService(
        repository=FakeSectionRepository(),
        test_repository=FakeTestRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    with pytest.raises(ServiceException, match="Unknown questionSetId 'UNKNOWN_SET'"):
        service.create_section(
            "test-1",
            SectionCreateRequest(
                questionSetId="UNKNOWN_SET",
                name="Science",
                description="Science basics",
                duration=45,
                displayOrder=2,
                status="draft",
            ),
        )
