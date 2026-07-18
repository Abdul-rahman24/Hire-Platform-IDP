from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class QuestionRequestBase(BaseModel):
    question_set_id: str = Field(alias="questionSetId", min_length=1)
    type: Literal["mcq", "descriptive"]
    question_text: str = Field(alias="questionText", min_length=1, max_length=5000)
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, alias="correctAnswer", max_length=2000)
    difficulty: Literal["easy", "medium", "hard"]
    category: str = Field(min_length=1, max_length=255)
    marks: int = Field(ge=0)
    negative_marks: int = Field(alias="negativeMarks", ge=0)
    status: Literal["draft", "active", "archived"] = "draft"

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_question_shape(self) -> "QuestionRequestBase":
        if self.type == "mcq":
            if self.options is None or len(self.options) < 2:
                raise ValueError("MCQ questions require at least 2 options")
            if self.correct_answer is None:
                raise ValueError("MCQ questions require a correctAnswer")
            if self.correct_answer not in self.options:
                raise ValueError("correctAnswer must be one of the provided options")
        return self


class QuestionCreateRequest(QuestionRequestBase):
    pass


class QuestionUpdateRequest(BaseModel):
    question_set_id: str | None = Field(default=None, alias="questionSetId", min_length=1)
    type: Literal["mcq", "descriptive"] | None = None
    question_text: str | None = Field(default=None, alias="questionText", min_length=1, max_length=5000)
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, alias="correctAnswer", max_length=2000)
    difficulty: Literal["easy", "medium", "hard"] | None = None
    category: str | None = Field(default=None, min_length=1, max_length=255)
    marks: int | None = Field(default=None, ge=0)
    negative_marks: int | None = Field(default=None, alias="negativeMarks", ge=0)
    status: Literal["draft", "active", "archived"] | None = None

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_question_shape(self) -> "QuestionUpdateRequest":
        question_type = self.type
        if question_type == "mcq":
            if self.options is None or len(self.options) < 2:
                raise ValueError("MCQ questions require at least 2 options")
            if self.correct_answer is None:
                raise ValueError("MCQ questions require a correctAnswer")
            if self.correct_answer not in self.options:
                raise ValueError("correctAnswer must be one of the provided options")
        elif self.correct_answer is not None and self.options is not None and self.correct_answer not in self.options:
            raise ValueError("correctAnswer must be one of the provided options")
        return self


class QuestionResponse(BaseModel):
    id: str
    question_set_id: str | None = Field(default=None, alias="questionSetId")
    type: str
    question_text: str = Field(alias="questionText")
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, alias="correctAnswer")
    difficulty: str
    category: str
    marks: int
    negative_marks: int = Field(alias="negativeMarks")
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class QuestionListResponse(BaseModel):
    items: list[QuestionResponse]
    count: int
