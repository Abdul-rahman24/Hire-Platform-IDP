from datetime import datetime
from typing import Any
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from app.schemas.section import SectionResponse, SectionWithQuestionsResponse


class TestCreateRequest(BaseModel):
    title: str = Field(
        ...,
        alias="title",
        validation_alias=AliasChoices("title", "name"),
        serialization_alias="title",
        min_length=1,
        max_length=255,
    )
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default="published")
    test_status: str | None = Field(
        default="Active",
        alias="testStatus",
        validation_alias=AliasChoices("testStatus", "test_status", "status"),
        serialization_alias="testStatus",
    )
    duration_minutes: int | None = Field(
        default=None,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes", "totalDurationMinutes", "duration"),
        serialization_alias="durationMinutes",
    )
    total_marks: int | None = Field(
        default=None,
        alias="totalMarks",
        validation_alias=AliasChoices("totalMarks", "total_marks"),
        serialization_alias="totalMarks",
    )

    model_config = ConfigDict(populate_by_name=True)


class TestUpdateRequest(BaseModel):
    title: str | None = Field(
        default=None,
        alias="title",
        validation_alias=AliasChoices("title", "name"),
        serialization_alias="title",
        min_length=1,
        max_length=255,
    )
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default=None)
    test_status: str | None = Field(
        default=None,
        alias="testStatus",
        validation_alias=AliasChoices("testStatus", "test_status", "status"),
        serialization_alias="testStatus",
    )
    duration_minutes: int | None = Field(
        default=None,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes", "totalDurationMinutes", "duration"),
        serialization_alias="durationMinutes",
    )
    total_marks: int | None = Field(
        default=None,
        alias="totalMarks",
        validation_alias=AliasChoices("totalMarks", "total_marks"),
        serialization_alias="totalMarks",
    )

    model_config = ConfigDict(populate_by_name=True)


CreateTestRequest = TestCreateRequest
UpdateTestRequest = TestUpdateRequest


class TestResponse(BaseModel):
    test_id: str = Field(
        ...,
        alias="testId",
        validation_alias=AliasChoices("testId", "test_id", "id"),
        serialization_alias="testId",
    )
    link_id: str | None = Field(
        default=None,
        alias="linkId",
        validation_alias=AliasChoices("linkId", "link_id"),
        serialization_alias="linkId",
    )
    title: str = Field(
        ...,
        alias="title",
        validation_alias=AliasChoices("title", "name"),
        serialization_alias="title",
    )
    description: str | None = None
    status: str = "published"
    test_status: str = Field(
        default="Active",
        alias="testStatus",
        validation_alias=AliasChoices("testStatus", "test_status", "status"),
        serialization_alias="testStatus",
    )
    duration_minutes: int | None = Field(
        default=None,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes"),
        serialization_alias="durationMinutes",
    )
    total_marks: int | None = Field(
        default=None,
        alias="totalMarks",
        validation_alias=AliasChoices("totalMarks", "total_marks"),
        serialization_alias="totalMarks",
    )
    total_sections: int = Field(
        default=0,
        alias="totalSections",
        validation_alias=AliasChoices("totalSections", "total_sections"),
        serialization_alias="totalSections",
    )
    total_duration_minutes: int = Field(
        default=0,
        alias="totalDurationMinutes",
        validation_alias=AliasChoices("totalDurationMinutes", "total_duration_minutes", "totalDuration"),
        serialization_alias="totalDurationMinutes",
    )
    created_at: datetime = Field(
        ...,
        alias="createdAt",
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )
    updated_at: datetime = Field(
        ...,
        alias="updatedAt",
        validation_alias=AliasChoices("updatedAt", "updated_at"),
        serialization_alias="updatedAt",
    )
    questions: list[dict[str, Any]] | None = Field(default=None)
    sections: list[SectionWithQuestionsResponse] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class TestListResponse(BaseModel):
    items: list[TestResponse]
    count: int


CompleteTestSectionResponse = SectionWithQuestionsResponse
CompleteTestResponse = TestResponse
