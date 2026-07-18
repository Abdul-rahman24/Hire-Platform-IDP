from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TestCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    status: Literal["draft", "published", "archived"] = "draft"


class TestUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    status: Literal["draft", "published", "archived"]


class TestResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class TestListResponse(BaseModel):
    items: list[TestResponse]
    count: int


class PublishTestResponse(BaseModel):
    test_id: str = Field(alias="testId")
    status: str
    published_at: datetime = Field(alias="publishedAt")

    model_config = ConfigDict(populate_by_name=True)


class PublishedQuestionResponse(BaseModel):
    question_id: str = Field(alias="questionId")
    question_text: str = Field(alias="questionText")
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, alias="correctAnswer")
    marks: int
    negative_marks: int = Field(alias="negativeMarks")
    display_order: int = Field(alias="displayOrder")

    model_config = ConfigDict(populate_by_name=True)


class PublishedSectionResponse(BaseModel):
    section_id: str = Field(alias="sectionId")
    name: str
    duration: int
    display_order: int = Field(alias="displayOrder")
    questions: list[PublishedQuestionResponse]

    model_config = ConfigDict(populate_by_name=True)


class PublishedTestResponse(BaseModel):
    test_id: str = Field(alias="testId")
    version: int
    published_at: datetime = Field(alias="publishedAt")
    name: str
    description: str | None = None
    status: str
    sections: list[PublishedSectionResponse]

    model_config = ConfigDict(populate_by_name=True)


class CompleteTestSectionResponse(BaseModel):
    section_id: str = Field(alias="sectionId")
    section_name: str = Field(alias="sectionName")
    duration: int
    shuffle_questions: bool = Field(alias="shuffleQuestions")
    question_set_id: str | None = Field(default=None, alias="questionSetId")
    question_ids: list[str] = Field(default_factory=list, alias="questionIds")

    model_config = ConfigDict(populate_by_name=True)


class CompleteTestResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: str
    sections: list[CompleteTestSectionResponse]


class FullTestOptionResponse(BaseModel):
    option_id: str = Field(alias="optionId")
    text: str

    model_config = ConfigDict(populate_by_name=True)


class FullTestQuestionResponse(BaseModel):
    question_id: str = Field(alias="questionId")
    question: str
    options: list[FullTestOptionResponse]
    correct_answer: str | None = Field(default=None, alias="correctAnswer")
    difficulty: str
    marks: int

    model_config = ConfigDict(populate_by_name=True)


class FullTestSectionResponse(BaseModel):
    section_id: str = Field(alias="sectionId")
    section_name: str = Field(alias="sectionName")
    duration: int
    question_set_id: str = Field(alias="questionSetId")
    question_set_name: str = Field(alias="questionSetName")
    questions: list[FullTestQuestionResponse]

    model_config = ConfigDict(populate_by_name=True)


class FullTestResponse(BaseModel):
    test_id: str = Field(alias="testId")
    test_name: str = Field(alias="testName")
    description: str | None = None
    instructions: str
    duration: int
    sections: list[FullTestSectionResponse]

    model_config = ConfigDict(populate_by_name=True)
