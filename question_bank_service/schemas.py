from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal

class OptionSchema(BaseModel):
    optionId: str
    text: str
  
class QuestionSetCreateSchema(BaseModel):
    questionSetId: str = Field(..., example="SET001")
    setType: Literal["MCQ", "CODING"] = Field(..., example="MCQ")

class QuestionCreateSchema(BaseModel):
    questionId: str = Field(..., example="Q001")
    questionSetId: str = Field(..., example="SET001")
    questionType: Literal["MCQ", "CODING"] = Field(..., example="MCQ")
    question: str
    marks: int = Field(2)
    
    options: Optional[List[OptionSchema]] = None
    correctOptionId: Optional[str] = None
    language: Optional[Literal["python", "java"]] = None

    @model_validator(mode='after')
    def validate_question_structure(self):
        if self.questionType == "MCQ":
            if not self.options or not self.correctOptionId:
                raise ValueError("MCQ format requires 'options' and 'correctOptionId'")
            self.language = None 
        elif self.questionType == "CODING":
            if not self.language:
                raise ValueError("CODING format requires a 'language' (python/java)")
            self.options = None
            self.correctOptionId = None
        return self

# NEW: Added the missing update schema to match your create schema
class QuestionUpdateSchema(BaseModel):
    questionType: Literal["MCQ", "CODING"] = Field(..., example="MCQ")
    question: str
    marks: int = Field(2)
    
    options: Optional[List[OptionSchema]] = None
    correctOptionId: Optional[str] = None
    language: Optional[Literal["python", "java"]] = None

    @model_validator(mode='after')
    def validate_question_structure(self):
        if self.questionType == "MCQ":
            if not self.options or not self.correctOptionId:
                raise ValueError("MCQ format requires 'options' and 'correctOptionId'")
            self.language = None
        elif self.questionType == "CODING":
            if not self.language:
                raise ValueError("CODING format requires 'language' (python/java)")
            self.options = None
            self.correctOptionId = None
        return self