from pydantic import AliasChoices, ConfigDict, Field

from app.models.base import BaseEntity


class SectionQuestionMappingEntity(BaseEntity):
    section_id: str = Field(
        validation_alias=AliasChoices("section_id", "sectionId"),
        serialization_alias="sectionId",
    )
    question_id: str = Field(
        validation_alias=AliasChoices("question_id", "questionId"),
        serialization_alias="questionId",
    )
    display_order: int = Field(
        default=0,
        ge=0,
        validation_alias=AliasChoices("display_order", "displayOrder"),
        serialization_alias="displayOrder",
    )
    marks: int = Field(ge=0)
    negative_marks: int = Field(
        default=0,
        ge=0,
        validation_alias=AliasChoices("negative_marks", "negativeMarks"),
        serialization_alias="negativeMarks",
    )
    is_mandatory: bool = Field(
        default=False,
        validation_alias=AliasChoices("is_mandatory", "isMandatory"),
        serialization_alias="isMandatory",
    )

    model_config = ConfigDict(populate_by_name=True)
