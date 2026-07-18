from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.exceptions import RepositoryNotFoundException, ServiceException
from app.models.question import QuestionEntity
from app.repositories.interfaces import QuestionRepositoryInterface
from app.schemas.question import QuestionCreateRequest, QuestionUpdateRequest
from app.services.question_service import QuestionService
from app.utils.question_bank_client import QuestionBankClient


class FakeQuestionRepository(QuestionRepositoryInterface[QuestionEntity]):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.entities = {
            "question-1": QuestionEntity(
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
                created_at=timestamp,
                updated_at=timestamp,
            )
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
        if entity_id not in self.entities:
            raise RepositoryNotFoundException("QuestionEntity not found")
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
            raise RepositoryNotFoundException("QuestionEntity not found")
        del self.entities[entity_id]


def test_create_question_returns_response_model() -> None:
    service = QuestionService(
        repository=FakeQuestionRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    result = service.create_question(
        QuestionCreateRequest(
            questionSetId="MOCK_SET_001",
            type="mcq",
            questionText="What is JVM?",
            options=["Java Virtual Machine", "Java Vendor Machine"],
            correctAnswer="Java Virtual Machine",
            difficulty="easy",
            category="java",
            marks=1,
            negativeMarks=0,
            status="active",
        )
    )

    assert result.type == "mcq"
    assert result.question_set_id == "MOCK_SET_001"
    assert result.question_text == "What is JVM?"
    assert result.correct_answer == "Java Virtual Machine"


def test_list_questions_returns_items() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    items = service.list_questions()

    assert len(items) == 1
    assert items[0].id == "question-1"


def test_get_questions_by_question_set_returns_filtered_items() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    items = service.get_questions_by_question_set("MOCK_SET_001")

    assert len(items) == 1
    assert items[0].question_set_id == "MOCK_SET_001"


def test_get_question_returns_item() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    result = service.get_question("question-1")

    assert result.id == "question-1"
    assert result.category == "java"


def test_update_question_preserves_identity() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    result = service.update_question(
        "question-1",
        QuestionUpdateRequest(
            type="descriptive",
            questionText="Explain JVM",
            options=None,
            correctAnswer=None,
            difficulty="medium",
            category="java",
            marks=5,
            negativeMarks=0,
            status="draft",
        ),
    )

    assert result.id == "question-1"
    assert result.created_at == datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
    assert result.updated_at >= result.created_at


def test_update_question_supports_partial_payload() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    result = service.update_question(
        "question-1",
        QuestionUpdateRequest(
            questionText="What does JVM stand for?",
            marks=2,
            status="draft",
        ),
    )

    assert result.id == "question-1"
    assert result.type == "mcq"
    assert result.question_text == "What does JVM stand for?"
    assert result.correct_answer == "class"
    assert result.marks == 2
    assert result.created_at == datetime(2026, 7, 16, 0, 0, tzinfo=UTC)


def test_delete_missing_question_raises_not_found() -> None:
    service = QuestionService(repository=FakeQuestionRepository())

    with pytest.raises(RepositoryNotFoundException):
        service.delete_question("missing")


def test_create_question_rejects_unknown_question_set_id() -> None:
    service = QuestionService(
        repository=FakeQuestionRepository(),
        question_bank_provider=QuestionBankClient(),
    )

    with pytest.raises(ServiceException, match="Unknown questionSetId 'UNKNOWN_SET'"):
        service.create_question(
            QuestionCreateRequest(
                questionSetId="UNKNOWN_SET",
                type="mcq",
                questionText="What is JVM?",
                options=["Java Virtual Machine", "Java Vendor Machine"],
                correctAnswer="Java Virtual Machine",
                difficulty="easy",
                category="java",
                marks=1,
                negativeMarks=0,
                status="active",
            )
        )
