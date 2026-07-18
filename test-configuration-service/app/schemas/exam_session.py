from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExamSessionCreateRequest(BaseModel):
    assignment_id: str = Field(alias="assignmentId", min_length=1)
    student_id: str = Field(alias="studentId", min_length=1)
    ip_address: str | None = Field(default=None, alias="ipAddress", max_length=255)
    user_agent: str | None = Field(default=None, alias="userAgent", max_length=1024)
    auto_submit: bool = Field(default=True, alias="autoSubmit")

    model_config = ConfigDict(populate_by_name=True)


class ExamSessionHeartbeatRequest(BaseModel):
    remaining_time: int = Field(alias="remainingTime", ge=0)

    model_config = ConfigDict(populate_by_name=True)


class ExamSessionResponse(BaseModel):
    id: str
    assignment_id: str = Field(alias="assignmentId")
    test_id: str = Field(alias="testId")
    student_id: str = Field(alias="studentId")
    published_version: int = Field(alias="publishedVersion")
    status: Literal["created", "started", "submitted", "expired", "auto_submitted"]
    started_at: datetime | None = Field(default=None, alias="startedAt")
    submitted_at: datetime | None = Field(default=None, alias="submittedAt")
    expires_at: datetime | None = Field(default=None, alias="expiresAt")
    remaining_time: int = Field(alias="remainingTime")
    total_duration: int = Field(alias="totalDuration")
    auto_submit: bool = Field(alias="autoSubmit")
    ip_address: str | None = Field(default=None, alias="ipAddress")
    user_agent: str | None = Field(default=None, alias="userAgent")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class ExamSessionListResponse(BaseModel):
    items: list[ExamSessionResponse]
    count: int
