from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AssignmentCreateRequest(BaseModel):
    test_id: str = Field(alias="testId", min_length=1)
    student_id: str = Field(alias="studentId", min_length=1)
    student_name: str = Field(alias="studentName", min_length=1, max_length=255)
    student_email: str = Field(alias="studentEmail", min_length=3, max_length=320)
    assigned_by: str = Field(alias="assignedBy", min_length=1, max_length=255)
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")
    status: Literal["assigned", "active", "completed", "expired", "cancelled"] = "assigned"

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_dates(self) -> "AssignmentCreateRequest":
        if self.end_date <= self.start_date:
            raise ValueError("endDate must be after startDate")
        return self


class BulkAssignmentStudentRequest(BaseModel):
    student_id: str = Field(alias="studentId", min_length=1)
    student_name: str = Field(alias="studentName", min_length=1, max_length=255)
    student_email: str = Field(alias="studentEmail", min_length=3, max_length=320)

    model_config = ConfigDict(populate_by_name=True)


class BulkAssignmentCreateRequest(BaseModel):
    test_id: str = Field(alias="testId", min_length=1)
    students: list[BulkAssignmentStudentRequest] = Field(min_length=1)
    assigned_by: str = Field(alias="assignedBy", min_length=1, max_length=255)
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_dates(self) -> "BulkAssignmentCreateRequest":
        if self.end_date <= self.start_date:
            raise ValueError("endDate must be after startDate")
        return self


class AssignmentUpdateRequest(BaseModel):
    start_date: datetime | None = Field(default=None, alias="startDate")
    end_date: datetime | None = Field(default=None, alias="endDate")
    status: Literal["assigned", "active", "completed", "expired", "cancelled"] | None = None

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_dates(self) -> "AssignmentUpdateRequest":
        if self.start_date is not None and self.end_date is not None and self.end_date <= self.start_date:
            raise ValueError("endDate must be after startDate")
        return self


class AssignmentResponse(BaseModel):
    id: str
    test_id: str = Field(alias="testId")
    student_id: str = Field(alias="studentId")
    student_name: str = Field(alias="studentName")
    student_email: str = Field(alias="studentEmail")
    assigned_by: str = Field(alias="assignedBy")
    assigned_at: datetime = Field(alias="assignedAt")
    start_date: datetime = Field(alias="startDate")
    end_date: datetime = Field(alias="endDate")
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class AssignmentListResponse(BaseModel):
    items: list[AssignmentResponse]
    count: int


class BulkAssignmentResponse(BaseModel):
    test_id: str = Field(alias="testId")
    number_assigned: int = Field(alias="numberAssigned")
    number_skipped: int = Field(alias="numberSkipped")

    model_config = ConfigDict(populate_by_name=True)
