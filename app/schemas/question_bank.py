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



