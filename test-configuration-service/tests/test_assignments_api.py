from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.dependencies.providers import get_assignment_service
from app.main import app
from app.schemas.assignment import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    BulkAssignmentCreateRequest,
    BulkAssignmentResponse,
)
from app.services.interfaces import AssignmentServiceInterface


class FakeAssignmentService(AssignmentServiceInterface):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 17, 0, 0, tzinfo=UTC)
        self.assignment = AssignmentResponse(
            id="assignment-1",
            testId="test-1",
            studentId="student-1",
            studentName="Ada",
            studentEmail="ada@example.com",
            assignedBy="admin",
            assignedAt=timestamp,
            startDate=datetime(2026, 7, 18, 0, 0, tzinfo=UTC),
            endDate=datetime(2026, 7, 19, 0, 0, tzinfo=UTC),
            status="assigned",
            created_at=timestamp,
            updated_at=timestamp,
        )

    def create_assignment(self, payload: AssignmentCreateRequest) -> AssignmentResponse:
        if payload.student_id == "duplicate":
            raise RepositoryConflictException("Active assignment already exists")
        return self.assignment.model_copy(
            update={
                "test_id": payload.test_id,
                "student_id": payload.student_id,
                "student_name": payload.student_name,
                "student_email": payload.student_email,
                "assigned_by": payload.assigned_by,
                "start_date": payload.start_date,
                "end_date": payload.end_date,
                "status": payload.status,
            },
        )

    def create_bulk_assignments(self, payload: BulkAssignmentCreateRequest) -> BulkAssignmentResponse:
        return BulkAssignmentResponse(
            testId=payload.test_id,
            numberAssigned=len(payload.students) - 1,
            numberSkipped=1,
        )

    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentResponse]:
        if student_id == "missing":
            return []
        return [self.assignment]

    def get_assignment(self, assignment_id: str) -> AssignmentResponse:
        if assignment_id == "missing":
            raise RepositoryNotFoundException("AssignmentEntity not found")
        return self.assignment.model_copy(update={"id": assignment_id})

    def update_assignment(
        self,
        assignment_id: str,
        payload: AssignmentUpdateRequest,
    ) -> AssignmentResponse:
        if assignment_id == "missing":
            raise RepositoryNotFoundException("AssignmentEntity not found")
        if assignment_id == "completed":
            raise RepositoryConflictException("Completed assignments cannot be updated")
        updates = {}
        if payload.start_date is not None:
            updates["start_date"] = payload.start_date
        if payload.end_date is not None:
            updates["end_date"] = payload.end_date
        if payload.status is not None:
            updates["status"] = payload.status
        return self.assignment.model_copy(update={"id": assignment_id, **updates})

    def delete_assignment(self, assignment_id: str) -> None:
        if assignment_id == "missing":
            raise RepositoryNotFoundException("AssignmentEntity not found")
        if assignment_id == "completed":
            raise RepositoryConflictException("Completed assignments cannot be cancelled")


client = TestClient(app)


def override_assignment_service() -> AssignmentServiceInterface:
    return FakeAssignmentService()


@pytest.fixture(autouse=True)
def set_assignment_service_override():
    app.dependency_overrides[get_assignment_service] = override_assignment_service
    yield
    app.dependency_overrides.pop(get_assignment_service, None)


def test_create_assignment_endpoint() -> None:
    response = client.post(
        "/assignments",
        json={
            "testId": "test-1",
            "studentId": "student-1",
            "studentName": "Ada",
            "studentEmail": "ada@example.com",
            "assignedBy": "admin",
            "startDate": "2026-07-18T00:00:00Z",
            "endDate": "2026-07-19T00:00:00Z",
            "status": "assigned",
        },
    )

    assert response.status_code == 201
    assert response.json()["studentId"] == "student-1"


def test_bulk_assignment_endpoint() -> None:
    response = client.post(
        "/assignments/bulk",
        json={
            "testId": "test-1",
            "assignedBy": "admin",
            "startDate": "2026-07-18T00:00:00Z",
            "endDate": "2026-07-19T00:00:00Z",
            "students": [
                {"studentId": "student-1", "studentName": "Ada", "studentEmail": "ada@example.com"},
                {"studentId": "student-2", "studentName": "Grace", "studentEmail": "grace@example.com"},
            ],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["numberAssigned"] == 1
    assert body["numberSkipped"] == 1


def test_list_assignments_endpoint() -> None:
    response = client.get("/assignments?studentId=student-1&status=assigned")

    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_get_assignment_endpoint() -> None:
    response = client.get("/assignments/assignment-1")

    assert response.status_code == 200
    assert response.json()["id"] == "assignment-1"


def test_get_assignment_returns_404_when_missing() -> None:
    response = client.get("/assignments/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_update_assignment_endpoint() -> None:
    response = client.put(
        "/assignments/assignment-1",
        json={
            "status": "active",
            "startDate": "2026-07-18T00:00:00Z",
            "endDate": "2026-07-20T00:00:00Z",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "active"


def test_delete_assignment_endpoint() -> None:
    response = client.delete("/assignments/assignment-1")

    assert response.status_code == 204
    assert response.content == b""


def test_create_assignment_returns_409_for_duplicate() -> None:
    response = client.post(
        "/assignments",
        json={
            "testId": "test-1",
            "studentId": "duplicate",
            "studentName": "Ada",
            "studentEmail": "ada@example.com",
            "assignedBy": "admin",
            "startDate": "2026-07-18T00:00:00Z",
            "endDate": "2026-07-19T00:00:00Z",
            "status": "assigned",
        },
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


def test_assignment_validation_error() -> None:
    response = client.post(
        "/assignments",
        json={
            "testId": "",
            "studentId": "student-1",
            "studentName": "Ada",
            "studentEmail": "ada@example.com",
            "assignedBy": "admin",
            "startDate": "2026-07-18T00:00:00Z",
            "endDate": "2026-07-17T00:00:00Z",
            "status": "assigned",
        },
    )

    assert response.status_code == 422
