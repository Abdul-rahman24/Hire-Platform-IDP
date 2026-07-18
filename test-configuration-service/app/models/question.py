from typing import Literal

from pydantic import AliasChoices, ConfigDict, Field

from app.models.base import BaseEntity


class QuestionEntity(BaseEntity):
    question_set_id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("question_set_id", "questionSetId"),
        serialization_alias="questionSetId",
    )
    type: Literal["mcq", "descriptive"]
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
    difficulty: Literal["easy", "medium", "hard"]
    category: str
    marks: int = Field(ge=0)
    negative_marks: int = Field(
        ge=0,
        validation_alias=AliasChoices("negative_marks", "negativeMarks"),
        serialization_alias="negativeMarks",
    )
    status: Literal["draft", "active", "archived"] = "draft"

    model_config = ConfigDict(populate_by_name=True)
