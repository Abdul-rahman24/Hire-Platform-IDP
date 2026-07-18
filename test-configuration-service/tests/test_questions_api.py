from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryNotFoundException
from app.dependencies.providers import get_question_service
from app.main import app
from app.schemas.question import (
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
)
from app.services.interfaces import QuestionServiceInterface


class FakeQuestionService(QuestionServiceInterface):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.question = QuestionResponse(
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

    def create_question(self, payload: QuestionCreateRequest) -> QuestionResponse:
        return self.question.model_copy(update=payload.model_dump())

    def get_question(self, question_id: str) -> QuestionResponse:
        if question_id == "missing":
            raise RepositoryNotFoundException("QuestionEntity not found")
        return self.question.model_copy(update={"id": question_id})

    def list_questions(self) -> list[QuestionResponse]:
        return [self.question]

    def get_questions_by_question_set(self, question_set_id: str) -> list[QuestionResponse]:
        return [self.question.model_copy(update={"question_set_id": question_set_id})]

    def update_question(
        self,
        question_id: str,
        payload: QuestionUpdateRequest,
    ) -> QuestionResponse:
        if question_id == "missing":
            raise RepositoryNotFoundException("QuestionEntity not found")
        return self.question.model_copy(update={"id": question_id, **payload.model_dump()})

    def delete_question(self, question_id: str) -> None:
        if question_id == "missing":
            raise RepositoryNotFoundException("QuestionEntity not found")
        return None


client = TestClient(app)


def override_question_service() -> QuestionServiceInterface:
    return FakeQuestionService()


app.dependency_overrides[get_question_service] = override_question_service


def test_create_question_endpoint() -> None:
    response = client.post(
        "/questions",
        json={
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
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["questionSetId"] == "MOCK_SET_001"
    assert body["type"] == "mcq"
    assert body["questionText"] == "Which keyword creates a class in Java?"


def test_list_questions_endpoint() -> None:
    response = client.get("/questions")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["items"][0]["id"] == "question-1"


def test_get_question_endpoint() -> None:
    response = client.get("/questions/question-1")

    assert response.status_code == 200
    assert response.json()["id"] == "question-1"


def test_get_question_endpoint_returns_404_when_missing() -> None:
    response = client.get("/questions/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_update_question_endpoint() -> None:
    response = client.put(
        "/questions/question-1",
        json={
            "questionSetId": "MOCK_SET_001",
            "questionText": "Explain JVM",
            "difficulty": "medium",
            "category": "java",
            "marks": 5,
            "negativeMarks": 0,
            "status": "draft",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "question-1"
    assert body["questionText"] == "Explain JVM"


def test_update_question_endpoint_returns_404_when_missing() -> None:
    response = client.put(
        "/questions/missing",
        json={
            "questionSetId": "MOCK_SET_001",
            "questionText": "Explain JVM",
            "difficulty": "medium",
            "category": "java",
            "marks": 5,
            "negativeMarks": 0,
            "status": "draft",
        },
    )

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_delete_question_endpoint() -> None:
    response = client.delete("/questions/question-1")

    assert response.status_code == 204
    assert response.content == b""


def test_delete_question_endpoint_returns_404_when_missing() -> None:
    response = client.delete("/questions/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_create_question_validation_error_for_invalid_mcq() -> None:
    response = client.post(
        "/questions",
        json={
            "questionSetId": "MOCK_SET_001",
            "type": "mcq",
            "questionText": "Invalid question",
            "options": ["A"],
            "correctAnswer": "B",
            "difficulty": "easy",
            "category": "java",
            "marks": 1,
            "negativeMarks": 0,
            "status": "active",
        },
    )

    assert response.status_code == 422
