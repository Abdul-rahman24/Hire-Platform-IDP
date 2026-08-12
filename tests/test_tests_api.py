from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import QuestionServiceException, RepositoryNotFoundException
from app.dependencies.providers import get_test_service
from app.main import app
from app.schemas.section import SectionWithQuestionsResponse
from app.schemas.test import (
    CreateTestRequest,
    TestResponse,
    UpdateTestRequest,
)
from app.services.interfaces import TestServiceInterface


class FakeTestService(TestServiceInterface):
    def __init__(self) -> None:
        self.tests: dict[str, TestResponse] = {
            "TEST-001": TestResponse(
                testId="TEST-001",
                title="Mid Semester Examination",
                description="Midterm",
                status="published",
                totalSections=1,
                totalDurationMinutes=30,
                totalMarks=40,
                createdAt="2026-07-29T00:00:00Z",
                updatedAt="2026-07-29T00:00:00Z",
                sections=[
                    SectionWithQuestionsResponse(
                        sectionId="SEC-001",
                        testId="TEST-001",
                        sectionName="Section A: Java",
                        questionSetId="SET001",
                        questionType="MCQ",
                        durationMinutes=30,
                        marks=40,
                        order=1,
                        shuffleQuestions=True,
                        shuffleOptions=True,
                        createdAt="2026-07-29T00:00:00Z",
                        updatedAt="2026-07-29T00:00:00Z",
                        questions=[
                            {
                                "questionId": "Q-101",
                                "question": "What is Python?",
                                "marks": 2,
                                "options": [
                                    {"optionId": "A", "text": "Language"},
                                    {"optionId": "B", "text": "Animal"},
                                ],
                            }
                        ],
                    )
                ],
            )
        }

    def create_test(self, payload: CreateTestRequest) -> TestResponse:
        test_id = str(uuid4())
        created = TestResponse(
            testId=test_id,
            title=payload.title,
            description=payload.description,
            status=payload.status,
            totalSections=0,
            totalDurationMinutes=0,
            totalMarks=0,
            createdAt="2026-07-29T00:00:00Z",
            updatedAt="2026-07-29T00:00:00Z",
            sections=[],
        )
        self.tests[test_id] = created
        return created

    def get_test(self, test_id: str) -> TestResponse:
        if test_id == "TEST-503":
            raise QuestionServiceException("Unable to retrieve question set.")
        if test_id not in self.tests:
            raise RepositoryNotFoundException(f"Test with id '{test_id}' was not found")
        return self.tests[test_id]

    def get_complete_test(self, test_id: str) -> TestResponse:
        return self.get_test(test_id)

    def list_tests(self) -> list[TestResponse]:
        return list(self.tests.values())

    def update_test(self, test_id: str, payload: UpdateTestRequest) -> TestResponse:
        if test_id not in self.tests:
            raise RepositoryNotFoundException(f"Test with id '{test_id}' was not found")
        existing = self.tests[test_id]
        updated = TestResponse(
            testId=test_id,
            title=payload.title if payload.title is not None else existing.title,
            description=payload.description if payload.description is not None else existing.description,
            status=payload.status if payload.status is not None else existing.status,
            totalSections=existing.total_sections,
            totalDurationMinutes=existing.total_duration_minutes,
            totalMarks=existing.total_marks,
            createdAt=existing.created_at,
            updatedAt=existing.updated_at,
            sections=existing.sections,
        )
        self.tests[test_id] = updated
        return updated

    def delete_test(self, test_id: str) -> None:
        if test_id not in self.tests:
            raise RepositoryNotFoundException(f"Test with id '{test_id}' was not found")
        del self.tests[test_id]


client = TestClient(app)


def override_test_service() -> TestServiceInterface:
    return FakeTestService()


@pytest.fixture(autouse=True)
def set_test_service_override():
    app.dependency_overrides[get_test_service] = override_test_service
    yield
    app.dependency_overrides.pop(get_test_service, None)


def test_create_test_endpoint() -> None:
    response = client.post(
        "/tests",
        json={
            "title": "Final Semester Examination",
            "description": "Final Exam",
            "status": "draft",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["testId"]) == 36
    assert body["title"] == "Final Semester Examination"


def test_list_tests_endpoint() -> None:
    response = client.get("/tests")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["items"][0]["testId"] == "TEST-001"


def test_get_test_endpoint() -> None:
    response = client.get("/tests/TEST-001")

    assert response.status_code == 200
    body = response.json()
    assert body["testId"] == "TEST-001"
    assert body["totalSections"] == 1
    assert len(body["sections"]) == 1
    assert body["sections"][0]["sectionId"] == "SEC-001"


def test_get_test_endpoint_returns_404_when_missing() -> None:
    response = client.get("/tests/TEST-999")
    assert response.status_code == 404


def test_update_test_endpoint() -> None:
    response = client.put(
        "/tests/TEST-001",
        json={"title": "Updated Exam Title"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["testId"] == "TEST-001"
    assert body["title"] == "Updated Exam Title"


def test_delete_test_endpoint() -> None:
    response = client.delete("/tests/TEST-001")

    assert response.status_code == 204
    assert response.content == b""
