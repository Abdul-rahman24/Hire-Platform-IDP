from datetime import datetime
from typing import Any
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class SectionCreateRequest(BaseModel):
    section_name: str = Field(
        ...,
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section_name", "title", "name"),
        serialization_alias="sectionName",
        min_length=1,
        max_length=255,
    )
    question_set_id: str = Field(
        ...,
        alias="questionSetId",
        validation_alias=AliasChoices("questionSetId", "question_set_id"),
        serialization_alias="questionSetId",
        min_length=1,
    )
    duration_minutes: int = Field(
        default=30,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes", "duration"),
        serialization_alias="durationMinutes",
        ge=1,
        le=1440,
    )
    marks: int = Field(default=0, ge=0)
    order: int = Field(default=1, ge=1)
    shuffle_questions: bool = Field(
        default=False,
        alias="shuffleQuestions",
        validation_alias=AliasChoices("shuffleQuestions", "shuffle_questions"),
        serialization_alias="shuffleQuestions",
    )
    shuffle_options: bool = Field(
        default=False,
        alias="shuffleOptions",
        validation_alias=AliasChoices("shuffleOptions", "shuffle_options"),
        serialization_alias="shuffleOptions",
    )

    model_config = ConfigDict(populate_by_name=True)


class SectionUpdateRequest(BaseModel):
    section_name: str | None = Field(
        default=None,
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section_name", "title", "name"),
        serialization_alias="sectionName",
        min_length=1,
        max_length=255,
    )
    question_set_id: str | None = Field(
        default=None,
        alias="questionSetId",
        validation_alias=AliasChoices("questionSetId", "question_set_id"),
        serialization_alias="questionSetId",
    )
    duration_minutes: int | None = Field(
        default=None,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes", "duration"),
        serialization_alias="durationMinutes",
        ge=1,
        le=1440,
    )
    marks: int | None = Field(default=None, ge=0)
    order: int | None = Field(default=None, ge=1)
    shuffle_questions: bool | None = Field(
        default=None,
        alias="shuffleQuestions",
        validation_alias=AliasChoices("shuffleQuestions", "shuffle_questions"),
        serialization_alias="shuffleQuestions",
    )
    shuffle_options: bool | None = Field(
        default=None,
        alias="shuffleOptions",
        validation_alias=AliasChoices("shuffleOptions", "shuffle_options"),
        serialization_alias="shuffleOptions",
    )

    model_config = ConfigDict(populate_by_name=True)


class SectionResponse(BaseModel):
    section_id: str = Field(
        ...,
        alias="sectionId",
        validation_alias=AliasChoices("sectionId", "section_id", "id"),
        serialization_alias="sectionId",
    )
    test_id: str = Field(
        ...,
        alias="testId",
        validation_alias=AliasChoices("testId", "test_id"),
        serialization_alias="testId",
    )
    section_name: str = Field(
        ...,
        alias="sectionName",
        validation_alias=AliasChoices("sectionName", "section_name", "title", "name"),
        serialization_alias="sectionName",
    )
    question_set_id: str = Field(
        ...,
        alias="questionSetId",
        validation_alias=AliasChoices("questionSetId", "question_set_id"),
        serialization_alias="questionSetId",
    )
    question_type: str | None = Field(
        default=None,
        alias="questionType",
        validation_alias=AliasChoices("questionType", "question_type"),
        serialization_alias="questionType",
    )
    duration_minutes: int = Field(
        ...,
        alias="durationMinutes",
        validation_alias=AliasChoices("durationMinutes", "duration_minutes", "duration"),
        serialization_alias="durationMinutes",
    )
    marks: int = Field(default=0)
    order: int = Field(default=1)
    shuffle_questions: bool = Field(
        default=False,
        alias="shuffleQuestions",
        validation_alias=AliasChoices("shuffleQuestions", "shuffle_questions"),
        serialization_alias="shuffleQuestions",
    )
    shuffle_options: bool = Field(
        default=False,
        alias="shuffleOptions",
        validation_alias=AliasChoices("shuffleOptions", "shuffle_options"),
        serialization_alias="shuffleOptions",
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

    model_config = ConfigDict(populate_by_name=True)


class SectionWithQuestionsResponse(SectionResponse):
    questions: list[dict[str, Any]] = Field(default_factory=list)


class SectionListResponse(BaseModel):
    items: list[SectionResponse]
    count: int
