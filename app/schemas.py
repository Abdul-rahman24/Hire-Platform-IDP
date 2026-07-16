from pydantic import BaseModel
from typing import List

class OptionSchema(BaseModel):
    optionId: str
    text: str

class QuestionCreateSchema(BaseModel):
    questionId: str
    questionSetId: str
    question: str
    options: List[OptionSchema]

class QuestionResponseSchema(BaseModel):
    questionId: str
    questionSetId: str
    question: str
    options: List[OptionSchema]

class QuestionSetResponseSchema(BaseModel):
    questionSetId: str
    questions: List[QuestionResponseSchema]