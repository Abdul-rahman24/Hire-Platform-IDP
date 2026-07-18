from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException, ServiceException
from app.models.published_test import PublishedTestEntity
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    PublishedTestRepositoryInterface,
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.question import QuestionUpdateRequest
from app.schemas.section import SectionUpdateRequest
from app.schemas.section_question_mapping import SectionQuestionMappingUpdateRequest
from app.schemas.test import TestUpdateRequest
from app.services.question_service import QuestionService
from app.services.section_question_mapping_service import SectionQuestionMappingService
from app.services.section_service import SectionService
from app.services.test_service import TestService


class FakePublishedTestRepository(PublishedTestRepositoryInterface[PublishedTestEntity]):
    def __init__(self) -> None:
        self.entities: dict[tuple[str, int], PublishedTestEntity] = {}

    def create(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        self.entities[(entity.test_id, entity.version)] = entity
        return entity

    def get_latest(self, test_id: str) -> PublishedTestEntity:
        versions = [version for (entity_test_id, version) in self.entities if entity_test_id == test_id]
        if not versions:
            raise RepositoryNotFoundException("PublishedTestEntity not found")
        return self.entities[(test_id, max(versions))]

    def get_version(self, test_id: str, version: int) -> PublishedTestEntity:
        entity = self.entities.get((test_id, version))
        if entity is None:
            raise RepositoryNotFoundException("PublishedTestEntity not found")
        return entity

    def get_latest_version_number(self, test_id: str) -> int:
        versions = [version for (entity_test_id, version) in self.entities if entity_test_id == test_id]
        return max(versions) if versions else 0

    def publish_snapshot(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        self.entities[(entity.test_id, entity.version)] = entity
        return entity


class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self, status: str = "draft") -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "test-1": TestEntity(
                id="test-1",
                name="Midterm",
                description="Sample test",
                status=status,
                created_at=timestamp,
                updated_at=timestamp,
            )
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
        self.get(entity_id)
        del self.entities[entity_id]


class FakeSectionRepository(SectionRepositoryInterface[SectionEntity]):
    def __init__(self, sections: list[SectionEntity] | None = None) -> None:
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
                status="active",
                created_at=timestamp,
                updated_at=timestamp,
            )
        }
        if sections is not None:
            self.entities = {section.id: section for section in sections}

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
        self.entities[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        del self.entities[entity_id]


class FakeQuestionRepository(QuestionRepositoryInterface[QuestionEntity]):
    def __init__(self, questions: list[QuestionEntity] | None = None) -> None:
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
            )
        }
        if questions is not None:
            self.entities = {question.id: question for question in questions}

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
        del self.entities[entity_id]


class FakeMappingRepository(
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self, mappings: list[SectionQuestionMappingEntity] | None = None) -> None:
        self.entities = {
            ("section-1", "question-1"): SectionQuestionMappingEntity(
                id="section-1#question-1",
                section_id="section-1",
                question_id="question-1",
                display_order=1,
                marks=2,
                negative_marks=0,
                is_mandatory=True,
            )
        }
        if mappings is not None:
            self.entities = {
                (mapping.section_id, mapping.question_id): mapping
                for mapping in mappings
            }

    def create(self, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingEntity:
        self.entities[(entity.section_id, entity.question_id)] = entity
        return entity

    def get(self, entity_id: str) -> SectionQuestionMappingEntity:
        section_id, question_id = entity_id.split("#", 1)
        return self.get_mapping(section_id, question_id)

    def list(self) -> list[SectionQuestionMappingEntity]:
        return list(self.entities.values())

    def update(self, entity_id: str, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingEntity:
        self.entities[(entity.section_id, entity.question_id)] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        section_id, question_id = entity_id.split("#", 1)
        self.delete_mapping(section_id, question_id)

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

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        self.entities[(section_id, question_id)] = entity
        return entity

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        if (section_id, question_id) not in self.entities:
            raise RepositoryNotFoundException("Mapping not found")
        del self.entities[(section_id, question_id)]


def build_service(
    *,
    test_status: str = "draft",
    sections: list[SectionEntity] | None = None,
    questions: list[QuestionEntity] | None = None,
    mappings: list[SectionQuestionMappingEntity] | None = None,
    published_repository: FakePublishedTestRepository | None = None,
) -> TestService:
    return TestService(
        repository=FakeTestRepository(status=test_status),
        section_repository=FakeSectionRepository(sections=sections),
        question_repository=FakeQuestionRepository(questions=questions),
        mapping_repository=FakeMappingRepository(mappings=mappings),
        published_test_repository=published_repository or FakePublishedTestRepository(),
    )


def test_publish_success_returns_published_status() -> None:
    published_repository = FakePublishedTestRepository()
    service = build_service(published_repository=published_repository)

    result = service.publish_test("test-1")

    assert result.test_id == "test-1"
    assert result.status == "published"
    assert published_repository.get_latest("test-1").version == 1


def test_publish_missing_section_returns_validation_error() -> None:
    service = build_service(sections=[])

    with pytest.raises(ServiceException) as exc_info:
        service.publish_test("test-1")

    assert exc_info.value.status_code == 400
    assert "at least one section" in exc_info.value.message


def test_publish_missing_question_returns_validation_error() -> None:
    service = build_service(questions=[])

    with pytest.raises(ServiceException) as exc_info:
        service.publish_test("test-1")

    assert exc_info.value.status_code == 400
    assert "does not exist" in exc_info.value.message


def test_publish_inactive_section_returns_validation_error() -> None:
    section = SectionEntity(
        id="section-1",
        test_id="test-1",
        questionSetId="MOCK_SET_001",
        name="Math",
        duration=30,
        displayOrder=1,
        status="draft",
    )
    service = build_service(sections=[section])

    with pytest.raises(ServiceException) as exc_info:
        service.publish_test("test-1")

    assert exc_info.value.status_code == 400
    assert "must be active" in exc_info.value.message


def test_publish_inactive_question_returns_validation_error() -> None:
    question = QuestionEntity(
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
        status="draft",
    )
    service = build_service(questions=[question])

    with pytest.raises(ServiceException) as exc_info:
        service.publish_test("test-1")

    assert exc_info.value.status_code == 400
    assert "must be active" in exc_info.value.message


def test_publish_duplicate_display_order_returns_validation_error() -> None:
    sections = [
        SectionEntity(id="section-1", test_id="test-1", questionSetId="MOCK_SET_001", name="Math", duration=30, displayOrder=1, status="active"),
        SectionEntity(id="section-2", test_id="test-1", questionSetId="MOCK_SET_001", name="Science", duration=30, displayOrder=1, status="active"),
    ]
    mappings = [
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
            id="section-2#question-1",
            section_id="section-2",
            question_id="question-1",
            display_order=1,
            marks=2,
            negative_marks=0,
            is_mandatory=True,
        ),
    ]
    service = build_service(sections=sections, mappings=mappings)

    with pytest.raises(ServiceException) as exc_info:
        service.publish_test("test-1")

    assert exc_info.value.status_code == 400
    assert "Duplicate section displayOrder" in exc_info.value.message


def test_snapshot_correctness_includes_complete_hierarchy() -> None:
    service = build_service()

    snapshot = service.build_snapshot("test-1")

    assert snapshot.test_id == "test-1"
    assert snapshot.version == 1
    assert snapshot.sections[0].section_id == "section-1"
    assert snapshot.sections[0].questions[0].question_id == "question-1"
    assert snapshot.sections[0].questions[0].marks == 2


def test_version_increment_uses_latest_snapshot_version() -> None:
    published_repository = FakePublishedTestRepository()
    published_repository.create(
        PublishedTestEntity(
            testId="test-1",
            version=1,
            publishedAt=datetime(2026, 7, 16, 0, 0, tzinfo=UTC),
            name="Midterm",
            description="Sample test",
            status="published",
            sections=[],
        )
    )
    service = build_service(published_repository=published_repository)

    snapshot = service.build_snapshot("test-1")

    assert snapshot.version == 2


def test_immutable_snapshot_does_not_change_after_test_update_attempt() -> None:
    published_repository = FakePublishedTestRepository()
    service = build_service(published_repository=published_repository)
    service.publish_test("test-1")

    stored = published_repository.get_latest("test-1")
    service.repository.entities["test-1"] = service.repository.entities["test-1"].model_copy(update={"name": "Updated"})

    assert published_repository.get_latest("test-1").name == stored.name


def test_update_after_publish_returns_409() -> None:
    service = build_service(test_status="published")

    with pytest.raises(RepositoryConflictException):
        service.update_test(
            "test-1",
            TestUpdateRequest(name="Updated", description="Updated", status="archived"),
        )


def test_delete_after_publish_returns_409() -> None:
    service = build_service(test_status="published")

    with pytest.raises(RepositoryConflictException):
        service.delete_test("test-1")


def test_section_update_after_publish_returns_409() -> None:
    service = SectionService(
        repository=FakeSectionRepository(),
        test_repository=FakeTestRepository(status="published"),
        mapping_repository=FakeMappingRepository(),
    )

    with pytest.raises(RepositoryConflictException):
        service.update_section(
            "section-1",
            SectionUpdateRequest(
                questionSetId="MOCK_SET_001",
                name="Updated",
                description="Updated",
                duration=40,
                displayOrder=2,
                status="active",
            ),
        )


def test_mapping_delete_after_publish_returns_409() -> None:
    service = SectionQuestionMappingService(
        section_repository=FakeSectionRepository(),
        question_repository=FakeQuestionRepository(),
        mapping_repository=FakeMappingRepository(),
        test_repository=FakeTestRepository(status="published"),
    )

    with pytest.raises(RepositoryConflictException):
        service.delete_mapping("section-1", "question-1")


def test_question_update_after_publish_returns_409() -> None:
    service = QuestionService(
        repository=FakeQuestionRepository(),
        section_repository=FakeSectionRepository(),
        mapping_repository=FakeMappingRepository(),
        test_repository=FakeTestRepository(status="published"),
    )

    with pytest.raises(RepositoryConflictException):
        service.update_question(
            "question-1",
            QuestionUpdateRequest(
                questionText="Updated",
            ),
        )
