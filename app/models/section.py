from pydantic import AliasChoices, ConfigDict, Field
from app.models.base import BaseEntity


class SectionEntity(BaseEntity):
    test_id: str = Field(
        ...,
        validation_alias=AliasChoices("test_id", "testId"),
        serialization_alias="testId",
    )
    section_name: str = Field(
        ...,
        validation_alias=AliasChoices("section_name", "sectionName", "title", "name"),
        serialization_alias="sectionName",
    )
    question_set_id: str = Field(
        ...,
        validation_alias=AliasChoices("question_set_id", "questionSetId"),
        serialization_alias="questionSetId",
    )
    question_type: str | None = Field(
        default=None,
        validation_alias=AliasChoices("question_type", "questionType"),
        serialization_alias="questionType",
    )
    duration_minutes: int = Field(
        default=30,
        validation_alias=AliasChoices("duration_minutes", "durationMinutes", "duration"),
        serialization_alias="durationMinutes",
    )
    marks: int = Field(default=0)
    order: int = Field(default=1)
    shuffle_questions: bool = Field(
        default=False,
        validation_alias=AliasChoices("shuffle_questions", "shuffleQuestions"),
        serialization_alias="shuffleQuestions",
    )
    shuffle_options: bool = Field(
        default=False,
        validation_alias=AliasChoices("shuffle_options", "shuffleOptions"),
        serialization_alias="shuffleOptions",
    )

    model_config = ConfigDict(populate_by_name=True)
