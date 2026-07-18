from fastapi import APIRouter, Depends, Query, status

from app.dependencies.providers import get_exam_session_service
from app.schemas.exam_session import (
    ExamSessionCreateRequest,
    ExamSessionHeartbeatRequest,
    ExamSessionListResponse,
    ExamSessionResponse,
)
from app.services.interfaces import ExamSessionServiceInterface

router = APIRouter(prefix="/exam-sessions", tags=["Exam Sessions"])


@router.post(
    "",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create exam session",
    description="Create a runtime exam session from an assignment.",
)
async def create_exam_session(
    payload: ExamSessionCreateRequest,
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionResponse:
    return service.create_session(payload)


@router.get(
    "",
    response_model=ExamSessionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List exam sessions",
    description="List exam sessions with optional student, assignment, and status filters.",
)
async def list_exam_sessions(
    studentId: str | None = Query(default=None),
    assignmentId: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionListResponse:
    items = service.list_sessions(
        student_id=studentId,
        assignment_id=assignmentId,
        status=status_filter,
    )
    return ExamSessionListResponse(items=items, count=len(items))


@router.get(
    "/{sessionId}",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get exam session",
    description="Fetch a single exam session by id.",
)
async def get_exam_session(
    sessionId: str,
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionResponse:
    return service.get_session(sessionId)


@router.put(
    "/{sessionId}/start",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Start exam session",
    description="Transition an exam session from created to started.",
)
async def start_exam_session(
    sessionId: str,
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionResponse:
    return service.start_session(sessionId)


@router.put(
    "/{sessionId}/submit",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit exam session",
    description="Submit an active exam session.",
)
async def submit_exam_session(
    sessionId: str,
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionResponse:
    return service.submit_session(sessionId)


@router.post(
    "/{sessionId}/heartbeat",
    response_model=ExamSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Heartbeat exam session",
    description="Update remaining time for an active exam session.",
)
async def heartbeat_exam_session(
    sessionId: str,
    payload: ExamSessionHeartbeatRequest,
    service: ExamSessionServiceInterface = Depends(get_exam_session_service),
) -> ExamSessionResponse:
    return service.heartbeat(sessionId, payload)
