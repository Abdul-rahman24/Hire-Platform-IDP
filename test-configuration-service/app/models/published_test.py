from __future__ import annotations

from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class PublishedQuestionSnapshot(BaseModel):
    question_id: str = Field(
        validation_alias=AliasChoices("question_id", "questionId"),
        serialization_alias="questionId",
    )
    question_text: str = Field(
        validation_alias=AliasChoices("question_text", "questionText"),
        serialization_alias="questionText",
    )
    options: list[str] | None = None
    correct_answer: str | None = Field(
        default=None,
        validation_alias=AliasChoices("correct_answer", "correctAnswer"),
        serialization_alias="correctAnswer",
    )
    marks: int
    negative_marks: int = Field(
        validation_alias=AliasChoices("negative_marks", "negativeMarks"),
        serialization_alias="negativeMarks",
    )
    display_order: int = Field(
        validation_alias=AliasChoices("display_order", "displayOrder"),
        serialization_alias="displayOrder",
    )

    model_config = ConfigDict(populate_by_name=True)


class PublishedSectionSnapshot(BaseModel):
    section_id: str = Field(
        validation_alias=AliasChoices("section_id", "sectionId"),
        serialization_alias="sectionId",
    )
    name: str
    duration: int
    display_order: int = Field(
        validation_alias=AliasChoices("display_order", "displayOrder"),
        serialization_alias="displayOrder",
    )
    questions: list[PublishedQuestionSnapshot]

    model_config = ConfigDict(populate_by_name=True)


class PublishedTestEntity(BaseModel):
    test_id: str = Field(
        validation_alias=AliasChoices("test_id", "testId"),
        serialization_alias="testId",
    )
    version: int
    published_at: datetime = Field(
        validation_alias=AliasChoices("published_at", "publishedAt"),
        serialization_alias="publishedAt",
    )
    name: str
    description: str | None = None
    status: str = "published"
    sections: list[PublishedSectionSnapshot]

    model_config = ConfigDict(populate_by_name=True)
