from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.dependencies.providers import get_exam_session_service
from app.main import app
from app.schemas.exam_session import (
    ExamSessionCreateRequest,
    ExamSessionHeartbeatRequest,
    ExamSessionResponse,
)
from app.services.interfaces import ExamSessionServiceInterface


class FakeExamSessionService(ExamSessionServiceInterface):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
        self.session = ExamSessionResponse(
            id="session-1",
            assignmentId="assignment-1",
            testId="test-1",
            studentId="student-1",
            publishedVersion=1,
            status="created",
            startedAt=None,
            submittedAt=None,
            expiresAt=None,
            remainingTime=55,
            totalDuration=55,
            autoSubmit=True,
            ipAddress="127.0.0.1",
            userAgent="codex",
            created_at=timestamp,
            updated_at=timestamp,
        )

    def create_session(self, payload: ExamSessionCreateRequest) -> ExamSessionResponse:
        if payload.student_id == "duplicate":
            raise RepositoryConflictException("An unfinished exam session already exists")
        return self.session.model_copy(
            update={
                "assignment_id": payload.assignment_id,
                "student_id": payload.student_id,
                "ip_address": payload.ip_address,
                "user_agent": payload.user_agent,
                "auto_submit": payload.auto_submit,
            },
        )

    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[ExamSessionResponse]:
        return [self.session]

    def get_session(self, session_id: str) -> ExamSessionResponse:
        if session_id == "missing":
            raise RepositoryNotFoundException("ExamSessionEntity not found")
        return self.session.model_copy(update={"id": session_id})

    def start_session(self, session_id: str) -> ExamSessionResponse:
        if session_id == "missing":
            raise RepositoryNotFoundException("ExamSessionEntity not found")
        return self.session.model_copy(
            update={
                "id": session_id,
                "status": "started",
                "started_at": datetime(2026, 7, 17, 1, 0, tzinfo=UTC),
                "expires_at": datetime(2026, 7, 17, 1, 55, tzinfo=UTC),
            },
        )

    def submit_session(self, session_id: str) -> ExamSessionResponse:
        if session_id == "missing":
            raise RepositoryNotFoundException("ExamSessionEntity not found")
        return self.session.model_copy(
            update={
                "id": session_id,
                "status": "submitted",
                "submitted_at": datetime(2026, 7, 17, 1, 30, tzinfo=UTC),
            },
        )

    def heartbeat(
        self,
        session_id: str,
        payload: ExamSessionHeartbeatRequest,
    ) -> ExamSessionResponse:
        if session_id == "missing":
            raise RepositoryNotFoundException("ExamSessionEntity not found")
        return self.session.model_copy(
            update={
                "id": session_id,
                "status": "started",
                "remaining_time": payload.remaining_time,
            },
        )


client = TestClient(app)


def override_exam_session_service() -> ExamSessionServiceInterface:
    return FakeExamSessionService()


@pytest.fixture(autouse=True)
def set_exam_session_service_override():
    app.dependency_overrides[get_exam_session_service] = override_exam_session_service
    yield
    app.dependency_overrides.pop(get_exam_session_service, None)


def test_create_exam_session_endpoint() -> None:
    response = client.post(
        "/exam-sessions",
        json={
            "assignmentId": "assignment-1",
            "studentId": "student-1",
            "ipAddress": "127.0.0.1",
            "userAgent": "codex",
            "autoSubmit": True,
        },
    )

    assert response.status_code == 201
    assert response.json()["assignmentId"] == "assignment-1"


def test_list_exam_sessions_endpoint() -> None:
    response = client.get("/exam-sessions?studentId=student-1&status=created")

    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_get_exam_session_endpoint() -> None:
    response = client.get("/exam-sessions/session-1")

    assert response.status_code == 200
    assert response.json()["id"] == "session-1"


def test_start_exam_session_endpoint() -> None:
    response = client.put("/exam-sessions/session-1/start")

    assert response.status_code == 200
    assert response.json()["status"] == "started"


def test_submit_exam_session_endpoint() -> None:
    response = client.put("/exam-sessions/session-1/submit")

    assert response.status_code == 200
    assert response.json()["status"] == "submitted"


def test_heartbeat_exam_session_endpoint() -> None:
    response = client.post(
        "/exam-sessions/session-1/heartbeat",
        json={"remainingTime": 30},
    )

    assert response.status_code == 200
    assert response.json()["remainingTime"] == 30


def test_get_exam_session_returns_404_when_missing() -> None:
    response = client.get("/exam-sessions/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_create_exam_session_returns_409_for_duplicate() -> None:
    response = client.post(
        "/exam-sessions",
        json={
            "assignmentId": "assignment-1",
            "studentId": "duplicate",
            "ipAddress": "127.0.0.1",
            "userAgent": "codex",
            "autoSubmit": True,
        },
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


def test_exam_session_validation_error() -> None:
    response = client.post(
        "/exam-sessions",
        json={
            "assignmentId": "",
            "studentId": "",
            "autoSubmit": True,
        },
    )

    assert response.status_code == 422
