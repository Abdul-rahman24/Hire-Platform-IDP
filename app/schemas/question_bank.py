from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuestionSetResponse(BaseModel):
    question_set_id: str = Field(alias="questionSetId")
    question_set_name: str = Field(alias="questionSetName")
    total_questions: int = Field(alias="totalQuestions")

    model_config = ConfigDict(populate_by_name=True)


class QuestionResponse(BaseModel):
    question_id: str = Field(alias="questionId")
    question: str

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
