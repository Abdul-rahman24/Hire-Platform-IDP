from pydantic import AliasChoices, ConfigDict, Field
from app.models.base import BaseEntity


class TestEntity(BaseEntity):
    title: str = Field(
        ...,
        validation_alias=AliasChoices("title", "name"),
        serialization_alias="title",
    )
    description: str | None = None
    status: str = "published"
    test_status: str = Field(
        default="Active",
        validation_alias=AliasChoices("test_status", "testStatus", "status"),
        serialization_alias="testStatus",
    )
    link_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("link_id", "linkId", "link_code"),
        serialization_alias="linkId",
    )
    question_set_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("question_set_id", "questionSetId"),
        serialization_alias="questionSetId",
    )
    duration_minutes: int | None = Field(
        default=None,
        validation_alias=AliasChoices("duration_minutes", "durationMinutes", "duration"),
        serialization_alias="durationMinutes",
    )
    total_marks: int | None = Field(
        default=None,
        validation_alias=AliasChoices("total_marks", "totalMarks"),
        serialization_alias="totalMarks",
    )

    model_config = ConfigDict(populate_by_name=True)
