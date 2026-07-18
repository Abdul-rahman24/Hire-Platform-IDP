from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.core.exceptions import RepositoryConflictException, ServiceException
from app.core.logging import get_logger
from app.models.assignment import AssignmentEntity
from app.models.exam_session import ExamSessionEntity
from app.models.published_test import PublishedTestEntity
from app.repositories.interfaces import (
    AssignmentRepositoryInterface,
    ExamSessionRepositoryInterface,
    PublishedTestRepositoryInterface,
)
from app.schemas.exam_session import (
    ExamSessionCreateRequest,
    ExamSessionHeartbeatRequest,
    ExamSessionResponse,
)
from app.services.interfaces import ExamSessionServiceInterface

logger = get_logger(__name__)

SESSION_ACTIVE_STATUSES = {"created", "started"}
SESSION_TERMINAL_STATUSES = {"submitted", "expired", "auto_submitted"}
ASSIGNABLE_ASSIGNMENT_STATUSES = {"assigned", "active"}


class ExamSessionService(ExamSessionServiceInterface):
    def __init__(
        self,
        repository: ExamSessionRepositoryInterface[ExamSessionEntity],
        assignment_repository: AssignmentRepositoryInterface[AssignmentEntity],
        published_test_repository: PublishedTestRepositoryInterface[PublishedTestEntity],
    ) -> None:
        self.repository = repository
        self.assignment_repository = assignment_repository
        self.published_test_repository = published_test_repository

    def create_session(self, payload: ExamSessionCreateRequest) -> ExamSessionResponse:
        logger.info(
            "Creating exam session for assignment '%s' and student '%s'",
            payload.assignment_id,
            payload.student_id,
        )
        assignment = self._validate_assignment(payload.assignment_id, payload.student_id)
        snapshot = self.published_test_repository.get_latest(assignment.test_id)
        self._ensure_no_active_session(assignment.id)

        total_duration = sum(section.duration for section in snapshot.sections)
        entity = ExamSessionEntity(
            assignmentId=assignment.id,
            testId=assignment.test_id,
            studentId=assignment.student_id,
            publishedVersion=snapshot.version,
            status="created",
            remainingTime=total_duration,
            totalDuration=total_duration,
            autoSubmit=payload.auto_submit,
            ipAddress=payload.ip_address,
            userAgent=payload.user_agent,
        )
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity)

    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[ExamSessionResponse]:
        logger.info(
            "Listing exam sessions with filters student_id=%s assignment_id=%s status=%s",
            student_id,
            assignment_id,
            status,
        )
        entities = self.repository.list_sessions(
            student_id=student_id,
            assignment_id=assignment_id,
            status=status,
        )
        return [self._to_response(entity) for entity in entities]

    def get_session(self, session_id: str) -> ExamSessionResponse:
        logger.info("Fetching exam session '%s'", session_id)
        entity = self.repository.get(session_id)
        entity = self._apply_expiration(entity)
        return self._to_response(entity)

    def start_session(self, session_id: str) -> ExamSessionResponse:
        logger.info("Starting exam session '%s'", session_id)
        entity = self.repository.get(session_id)
        entity = self._apply_expiration(entity)
        if entity.status != "created":
            raise RepositoryConflictException("Exam session cannot be started in its current state")

        started_at = datetime.now(UTC)
        expires_at = started_at + timedelta(minutes=entity.total_duration)
        updated_entity = entity.model_copy(
            update={
                "status": "started",
                "started_at": started_at,
                "expires_at": expires_at,
                "remaining_time": entity.total_duration,
            },
        )
        stored_entity = self.repository.update(session_id, updated_entity)
        return self._to_response(stored_entity)

    def submit_session(self, session_id: str) -> ExamSessionResponse:
        logger.info("Submitting exam session '%s'", session_id)
        entity = self.repository.get(session_id)
        entity = self._apply_expiration(entity)
        if entity.status != "started":
            raise RepositoryConflictException("Exam session cannot be submitted in its current state")

        updated_entity = entity.model_copy(
            update={
                "status": "submitted",
                "submitted_at": datetime.now(UTC),
                "remaining_time": self._remaining_time_from_now(entity),
            },
        )
        stored_entity = self.repository.update(session_id, updated_entity)
        return self._to_response(stored_entity)

    def heartbeat(
        self,
        session_id: str,
        payload: ExamSessionHeartbeatRequest,
    ) -> ExamSessionResponse:
        logger.info("Heartbeat received for exam session '%s'", session_id)
        entity = self.repository.get(session_id)
        entity = self._apply_expiration(entity)
        if entity.status in {"submitted", "expired", "auto_submitted"}:
            raise RepositoryConflictException("Heartbeat is not allowed for completed or expired sessions")
        if entity.status != "started":
            raise RepositoryConflictException("Heartbeat is only allowed after the session has started")

        max_remaining = self._remaining_time_from_now(entity)
        if payload.remaining_time > entity.remaining_time or payload.remaining_time > max_remaining:
            raise ServiceException("Heartbeat cannot extend exam time", status_code=400)

        updated_entity = entity.model_copy(
            update={
                "remaining_time": payload.remaining_time,
            },
        )
        stored_entity = self.repository.update(session_id, updated_entity)
        return self._to_response(stored_entity)

    def _validate_assignment(self, assignment_id: str, student_id: str) -> AssignmentEntity:
        assignment = self.assignment_repository.get(assignment_id)
        if assignment.student_id != student_id:
            raise ServiceException("Student does not match the assignment", status_code=400)
        if assignment.status == "cancelled":
            raise ServiceException("Cancelled assignments cannot create exam sessions", status_code=400)
        if assignment.status not in ASSIGNABLE_ASSIGNMENT_STATUSES:
            raise ServiceException("Assignment is not eligible for exam session creation", status_code=400)
        return assignment

    def _ensure_no_active_session(self, assignment_id: str) -> None:
        sessions = self.repository.list_by_assignment_id(assignment_id)
        active_sessions = [
            self._apply_expiration(session)
            for session in sessions
        ]
        if any(session.status in SESSION_ACTIVE_STATUSES for session in active_sessions):
            raise RepositoryConflictException(
                f"An unfinished exam session already exists for assignment '{assignment_id}'",
            )

    def _apply_expiration(self, entity: ExamSessionEntity) -> ExamSessionEntity:
        if entity.status != "started" or entity.expires_at is None:
            return entity
        now = datetime.now(UTC)
        if now <= entity.expires_at:
            return entity

        next_status = "auto_submitted" if entity.auto_submit else "expired"
        updated_entity = entity.model_copy(
            update={
                "status": next_status,
                "submitted_at": entity.submitted_at or now if next_status == "auto_submitted" else entity.submitted_at,
                "remaining_time": 0,
            },
        )
        return self.repository.update(entity.id, updated_entity)

    def _remaining_time_from_now(self, entity: ExamSessionEntity) -> int:
        if entity.expires_at is None:
            return entity.remaining_time
        delta = entity.expires_at - datetime.now(UTC)
        return max(0, int(delta.total_seconds() // 60))

    def _to_response(self, entity: ExamSessionEntity) -> ExamSessionResponse:
        return ExamSessionResponse.model_validate(entity.model_dump(mode="python"))
