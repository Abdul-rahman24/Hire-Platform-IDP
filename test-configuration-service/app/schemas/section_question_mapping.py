from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SectionQuestionMappingCreateRequest(BaseModel):
    question_id: str = Field(alias="questionId", min_length=1)
    display_order: int = Field(alias="displayOrder", ge=0)
    marks: int = Field(ge=0)
    negative_marks: int = Field(alias="negativeMarks", ge=0)
    is_mandatory: bool = Field(alias="isMandatory")

    model_config = ConfigDict(populate_by_name=True)


class SectionQuestionMappingUpdateRequest(BaseModel):
    display_order: int | None = Field(default=None, alias="displayOrder", ge=0)
    marks: int | None = Field(default=None, ge=0)
    negative_marks: int | None = Field(default=None, alias="negativeMarks", ge=0)
    is_mandatory: bool | None = Field(default=None, alias="isMandatory")

    model_config = ConfigDict(populate_by_name=True)


class SectionQuestionMappingResponse(BaseModel):
    section_id: str = Field(alias="sectionId")
    question_id: str = Field(alias="questionId")
    display_order: int = Field(alias="displayOrder")
    marks: int
    negative_marks: int = Field(alias="negativeMarks")
    is_mandatory: bool = Field(alias="isMandatory")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)
