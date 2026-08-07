from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import QuestionServiceException, QuestionSetNotFoundException, RepositoryNotFoundException
from app.models.section import SectionEntity
from app.models.test import TestEntity
from app.repositories.interfaces import SectionRepositoryInterface, TestRepositoryInterface
from app.schemas.section import SectionCreateRequest, SectionWithQuestionsResponse
from app.schemas.test import CreateTestRequest, TestResponse, UpdateTestRequest
from app.utils.question_bank_client import QuestionBankClient
from app.services.section_service import SectionService
from app.services.test_service import TestService


class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "TEST-001": TestEntity(
                id="TEST-001",
                title="Mid Semester Examination",
                description="Sample Midterm",
                status="published",
                test_status="Active",
                link_id="123456",
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
        self.sections = {
            "SEC-001": SectionEntity(
                id="SEC-001",
                test_id="TEST-001",
                section_name="Section A: Core Java",
                question_set_id="SET001",
                question_type="MCQ",
                duration_minutes=30,
                marks=40,
                order=1,
                shuffle_questions=True,
                shuffle_options=True,
                created_at=timestamp,
                updated_at=timestamp,
            )
        }

    def create(self, entity: SectionEntity) -> SectionEntity:
        self.sections[entity.id] = entity
        return entity

    def get(self, entity_id: str) -> SectionEntity:
        sec = self.sections.get(entity_id)
        if sec is None:
            raise RepositoryNotFoundException("SectionEntity not found")
        return sec

    def list(self) -> list[SectionEntity]:
        return list(self.sections.values())

    def list_by_test_id(self, test_id: str) -> list[SectionEntity]:
        return [s for s in self.sections.values() if s.test_id == test_id]

    def update(self, entity_id: str, entity: SectionEntity) -> SectionEntity:
        self.sections[entity_id] = entity
        return entity

    def delete(self, entity_id: str) -> None:
        if entity_id in self.sections:
            del self.sections[entity_id]


class FakeQuestionBankClient(QuestionBankClient):
    def get_question_set(self, question_set_id: str) -> dict:
        if question_set_id == "UNAVAILABLE":
            raise QuestionServiceException("Unable to retrieve question set.")
        if question_set_id == "INVALID":
            raise QuestionSetNotFoundException("Question set not found.")
        return {
            "questionSetId": question_set_id,
            "title": "Sample Set",
            "questions": [
                {
                    "questionId": "Q-101",
                    "question": "What is Python?",
                    "type": "MCQ",
                    "marks": 2,
                    "options": [
                        {"optionId": "A", "text": "Language"},
                        {"optionId": "B", "text": "Animal"},
                    ],
                    "correctOptionId": "A",
                }
            ],
        }


def test_create_test_and_section() -> None:
    test_repo = FakeTestRepository()
    sec_repo = FakeSectionRepository()
    client = FakeQuestionBankClient()
    
    test_service = TestService(repository=test_repo, section_repository=sec_repo, question_bank_client=client)
    sec_service = SectionService(repository=sec_repo, test_repository=test_repo, question_bank_client=client)

    test_res = test_service.create_test(CreateTestRequest(title="Final Examination", description="Final Exam", status="published"))
    assert test_res.title == "Final Examination"
    assert len(test_res.test_id) == 36
    assert test_res.link_id is not None
    assert len(test_res.link_id) == 6
    assert test_res.link_id.isdigit()
    assert test_res.test_status == "Active"

    sec_res = sec_service.create_section(
        test_res.test_id,
        SectionCreateRequest(
            sectionName="Section 1",
            questionSetId="SET001",
            questionType="MCQ",
            durationMinutes=45,
            marks=50,
            order=1,
            shuffleQuestions=True,
            shuffleOptions=True,
        ),
    )
    assert sec_res.section_name == "Section 1"
    assert sec_res.question_set_id == "SET001"


def test_get_complete_test_aggregates_sections_and_questions() -> None:
    test_repo = FakeTestRepository()
    sec_repo = FakeSectionRepository()
    client = FakeQuestionBankClient()
    test_service = TestService(repository=test_repo, section_repository=sec_repo, question_bank_client=client)

    result = test_service.get_test("TEST-001")
    assert result.test_id == "TEST-001"
    assert result.title == "Mid Semester Examination"
    assert result.link_id == "123456"
    assert result.test_status == "Active"
    assert result.total_sections == 1
    assert result.total_duration_minutes == 30
    assert result.total_marks == 40
    assert len(result.sections) == 1
    assert len(result.sections[0].questions) == 1
