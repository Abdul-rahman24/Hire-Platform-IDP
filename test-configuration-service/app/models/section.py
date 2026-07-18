from pydantic import AliasChoices, ConfigDict, Field

from app.models.base import BaseEntity


class SectionEntity(BaseEntity):
    test_id: str = Field(
        validation_alias=AliasChoices("test_id", "testId"),
        serialization_alias="testId",
    )
    question_set_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("question_set_id", "questionSetId"),
        serialization_alias="questionSetId",
    )
    name: str = Field(
        validation_alias=AliasChoices("name", "section_name", "sectionName"),
    )
    description: str | None = None
    duration: int
    display_order: int = Field(
        default=0,
        validation_alias=AliasChoices("display_order", "displayOrder"),
        serialization_alias="displayOrder",
    )
    status: str = "draft"
    shuffle_questions: bool = Field(
        default=False,
        exclude=True,
        validation_alias=AliasChoices("shuffle_questions", "shuffleQuestions"),
    )

    model_config = ConfigDict(populate_by_name=True)

    @property
    def section_name(self) -> str:
        return self.name
