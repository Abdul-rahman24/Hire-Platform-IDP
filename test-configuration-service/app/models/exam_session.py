from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, ConfigDict, Field

from app.models.base import BaseEntity


class ExamSessionEntity(BaseEntity):
    id: str = Field(
        default_factory=BaseEntity.model_fields["id"].default_factory,
        validation_alias=AliasChoices("id", "sessionId"),
        serialization_alias="sessionId",
    )
    assignment_id: str = Field(
        validation_alias=AliasChoices("assignment_id", "assignmentId"),
        serialization_alias="assignmentId",
    )
    test_id: str = Field(
        validation_alias=AliasChoices("test_id", "testId"),
        serialization_alias="testId",
    )
    student_id: str = Field(
        validation_alias=AliasChoices("student_id", "studentId"),
        serialization_alias="studentId",
    )
    published_version: int = Field(
        validation_alias=AliasChoices("published_version", "publishedVersion"),
        serialization_alias="publishedVersion",
    )
    status: Literal["created", "started", "submitted", "expired", "auto_submitted"] = "created"
    started_at: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices("started_at", "startedAt"),
        serialization_alias="startedAt",
    )
    submitted_at: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices("submitted_at", "submittedAt"),
        serialization_alias="submittedAt",
    )
    expires_at: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices("expires_at", "expiresAt"),
        serialization_alias="expiresAt",
    )
    remaining_time: int = Field(
        ge=0,
        validation_alias=AliasChoices("remaining_time", "remainingTime"),
        serialization_alias="remainingTime",
    )
    total_duration: int = Field(
        ge=0,
        validation_alias=AliasChoices("total_duration", "totalDuration"),
        serialization_alias="totalDuration",
    )
    auto_submit: bool = Field(
        default=True,
        validation_alias=AliasChoices("auto_submit", "autoSubmit"),
        serialization_alias="autoSubmit",
    )
    ip_address: str | None = Field(
        default=None,
        validation_alias=AliasChoices("ip_address", "ipAddress"),
        serialization_alias="ipAddress",
    )
    user_agent: str | None = Field(
        default=None,
        validation_alias=AliasChoices("user_agent", "userAgent"),
        serialization_alias="userAgent",
    )

    model_config = ConfigDict(populate_by_name=True)
