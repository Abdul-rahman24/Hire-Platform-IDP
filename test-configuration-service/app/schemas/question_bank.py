from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuestionSetResponse(BaseModel):
    question_set_id: str = Field(alias="questionSetId")
    name: str
    description: str
    status: str

    model_config = ConfigDict(populate_by_name=True)


class QuestionResponse(BaseModel):
    question_id: str = Field(alias="questionId")
    question_set_id: str = Field(alias="questionSetId")
    question_text: str = Field(alias="questionText")
    question_type: str = Field(alias="questionType")
    options: list[str]
    correct_answer: str = Field(alias="correctAnswer")
    marks: int

    model_config = ConfigDict(populate_by_name=True)


class SectionQuestionMappingCreateRequest(BaseModel):
    question_set_id: str = Field(alias="questionSetId", min_length=1)
    question_ids: list[str] = Field(alias="questionIds", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class SectionQuestionMappingUpdateRequest(BaseModel):
    question_set_id: str = Field(alias="questionSetId", min_length=1)
    question_ids: list[str] = Field(alias="questionIds", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class SectionQuestionMappingResponse(BaseModel):
    id: str
    section_id: str = Field(alias="sectionId")
    question_set_id: str = Field(alias="questionSetId")
    question_ids: list[str] = Field(alias="questionIds")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)
