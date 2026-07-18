from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, ConfigDict, Field

from app.models.base import BaseEntity


class AssignmentEntity(BaseEntity):
    id: str = Field(
        default_factory=BaseEntity.model_fields["id"].default_factory,
        validation_alias=AliasChoices("id", "assignmentId"),
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
    student_name: str = Field(
        validation_alias=AliasChoices("student_name", "studentName"),
        serialization_alias="studentName",
    )
    student_email: str = Field(
        validation_alias=AliasChoices("student_email", "studentEmail"),
        serialization_alias="studentEmail",
    )
    assigned_by: str = Field(
        validation_alias=AliasChoices("assigned_by", "assignedBy"),
        serialization_alias="assignedBy",
    )
    assigned_at: datetime = Field(
        validation_alias=AliasChoices("assigned_at", "assignedAt"),
        serialization_alias="assignedAt",
    )
    start_date: datetime = Field(
        validation_alias=AliasChoices("start_date", "startDate"),
        serialization_alias="startDate",
    )
    end_date: datetime = Field(
        validation_alias=AliasChoices("end_date", "endDate"),
        serialization_alias="endDate",
    )
    status: Literal["assigned", "active", "completed", "expired", "cancelled"] = "assigned"

    model_config = ConfigDict(populate_by_name=True)
