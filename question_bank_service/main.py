import os
import boto3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal
from mangum import Mangum
from .repository import QuestionRepository
from question_bank_service import schemas

# Initialize FastAPI with the AWS API Gateway stage prefix safety net
app = FastAPI(
    title="Question Bank Microservice",
    description="Serverless Question Bank API for College Placement Platform",
    root_path="/default"
)

# Initialize AWS DynamoDB
DYNAMODB_TABLE_NAME = os.environ.get("TABLE_NAME", "QuestionBankTable_SW")
dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# ==========================================
# 1. PYDANTIC SCHEMAS (Data Validation)
# ==========================================

class Option(BaseModel):
    optionId: str = Field(..., example="A")
    text: str = Field(..., example="Java Virtual Machine")

# NEW: Set Creation Schema now requires a specific setType
class QuestionSetCreate(BaseModel):
    questionSetId: str = Field(..., example="SET001", description="Unique ID for the question set")
    setType: Literal["MCQ", "CODING"] = Field(..., example="MCQ", description="Set must contain purely MCQ or CODING questions")

# NEW: Dynamic Schema for Creating Questions (Handles MCQ & CODING)
class QuestionCreate(BaseModel):
    questionId: str = Field(..., example="Q001")
    questionSetId: str = Field(..., example="SET001")
    questionType: Literal["MCQ", "CODING"] = Field(..., example="MCQ")
    question: str = Field(..., example="What is JVM?")
    marks: int = Field(2, example=2, description="Marks assigned to this question")
    
    # Optional fields depending on questionType
    options: Optional[List[Option]] = None
    correctOptionId: Optional[str] = None
    language: Optional[Literal["python", "java"]] = None
    duration: Optional[int] = Field(None, example=15, description="Duration in minutes for coding tests")

    @model_validator(mode='after')
    def validate_question_structure(self):
        if self.questionType == "MCQ":
            if not self.options or not self.correctOptionId:
                raise ValueError("MCQ format requires 'options' and 'correctOptionId'")
        elif self.questionType == "CODING":
            if not self.language or not self.duration:
                raise ValueError("CODING format requires 'language' (python/java) and 'duration'")
        return self

# NEW: Dynamic Schema for Updating Questions
class QuestionUpdate(BaseModel):
    questionType: Literal["MCQ", "CODING"] = Field(..., example="MCQ")
    question: str = Field(..., example="What is JVM?")
    marks: int = Field(2, example=2, description="Marks assigned to this question")
    
    options: Optional[List[Option]] = None
    correctOptionId: Optional[str] = None
    language: Optional[Literal["python", "java"]] = None
    duration: Optional[int] = None

    @model_validator(mode='after')
    def validate_question_structure(self):
        if self.questionType == "MCQ":
            if not self.options or not self.correctOptionId:
                raise ValueError("MCQ format requires 'options' and 'correctOptionId'")
        elif self.questionType == "CODING":
            if not self.language or not self.duration:
                raise ValueError("CODING format requires 'language' (python/java) and 'duration'")
        return self

# ==========================================
# 2. API ENDPOINTS
# ==========================================

# 1. Create Question Set (Now includes setType)
@app.post("/question-sets", status_code=201, tags=["Question Sets"])
def create_question_set(payload: schemas.QuestionSetCreateSchema):
    try:
        item = {
            "questionSetId": payload.questionSetId,
            "questionId": "METADATA",
            "title": f"Assessment Set: {payload.questionSetId}",
            "setType": payload.setType,
            "itemType": "QUESTION_SET_HEADER"
        }
        table.put_item(Item=item)
        return {
            "message": f"Question Set '{payload.questionSetId}' ({payload.setType}) created successfully!",
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 2. List All Available Question Sets (MOVED UP for safe FastAPI routing)
@app.get("/question-sets", tags=["Question Sets"])
def list_all_question_sets():
    try:
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("questionId").eq("METADATA")
        )
        items = response.get("Items", [])
        return {
            "message": "Successfully retrieved all question sets",
            "totalSets": len(items),
            "data": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 3. Fetch all Questions in a Set
@app.get("/question-sets/{questionSetId}", tags=["Question Sets"])
def get_question_set(questionSetId: str):
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("questionSetId").eq(questionSetId)
        )
        items = response.get("Items", [])
        if not items:
            raise HTTPException(status_code=404, detail=f"No data found for question set {questionSetId}")
        
        set_metadata = next((item for item in items if item["questionId"] == "METADATA"), None)
        questions = [item for item in items if item["questionId"] != "METADATA"]

        return {
            "questionSetId": questionSetId,
            "setDetails": set_metadata or {"title": f"Set {questionSetId}", "description": "N/A"},
            "totalQuestions": len(questions),
            "questions": questions
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. Delete an Entire Question Set
@app.delete("/question-sets/{questionSetId}", tags=["Question Sets"])
def delete_question_set(questionSetId: str):
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("questionSetId").eq(questionSetId),
            ProjectionExpression="questionSetId, questionId"
        )
        items = response.get("Items", [])
        
        if not items:
            raise HTTPException(status_code=404, detail=f"Question Set '{questionSetId}' not found.")
            
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={"questionSetId": item["questionSetId"], "questionId": item["questionId"]})
                
        return {
            "message": f"Successfully deleted Set '{questionSetId}' and all its items.",
            "deletedCount": len(items)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. Fetch a SINGLE Question
@app.get("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def get_single_question(questionSetId: str, questionId: str):
    try:
        response = table.get_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        if "Item" not in response or response["Item"].get("questionId") == "METADATA":
            raise HTTPException(status_code=404, detail=f"Question '{questionId}' not found.")
        
        return {"message": "Question retrieved successfully", "data": response["Item"]}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. Add a Question inside a Set (Now enforces Set Type Matching)
@app.post("/questions", status_code=201, tags=["Questions"])
def create_question(payload: schemas.QuestionCreateSchema):
    try:
        # STEP 1: Cross-Entity Validation (Check parent set's type)
        parent_set = table.get_item(Key={"questionSetId": payload.questionSetId, "questionId": "METADATA"})
        
        if "Item" not in parent_set:
            raise HTTPException(status_code=404, detail=f"Target Question Set '{payload.questionSetId}' does not exist.")
            
        expected_type = parent_set["Item"].get("setType")
        if expected_type and expected_type != payload.questionType:
            raise HTTPException(
                status_code=400, 
                detail=f"Type Mismatch: Set '{payload.questionSetId}' only accepts {expected_type} questions, but you submitted a {payload.questionType} question."
            )

        # STEP 2: Save the item (exclude_none strips null fields out to keep the DB clean)
        item_data = payload.model_dump(exclude_none=True) if hasattr(payload, "model_dump") else payload.dict(exclude_none=True)
        item_data["itemType"] = "QUESTION"
        
        table.put_item(Item=item_data)
        return {
            "message": f"Question {payload.questionId} added to {payload.questionSetId}",
            "data": item_data
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 7. Update Existing Question
@app.put("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def update_question(questionSetId: str, questionId: str, payload: schemas.QuestionUpdateSchema):
    try:
        # 🛡️ This single line now delegates all fetching, validation, and saving to repository_2.py
        updated_item = QuestionRepository.update_question(questionSetId, questionId, payload)
        
        return {
            "message": "Question updated successfully!", 
            "data": updated_item
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 8. Delete Single Question
@app.delete("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def delete_question(questionSetId: str, questionId: str):
    try:
        table.delete_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        return {"message": f"Question '{questionId}' deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 9. Seed Demo Data (Updated to show MCQ and CODING sets)
@app.post("/seed-demo", tags=["Developer Tools"])
def seed_demo_data():
    try:
        # Create an MCQ Set
        table.put_item(Item={
            "questionSetId": "SET_MCQ_01",
            "questionId": "METADATA",
            "title": "Aptitude Round",
            "setType": "MCQ",
            "itemType": "QUESTION_SET_HEADER"
        })
        table.put_item(Item={
            "questionSetId": "SET_MCQ_01",
            "questionId": "Q001",
            "questionType": "MCQ",
            "question": "What is 2+2?",
            "options": [{"optionId": "A", "text": "4"}, {"optionId": "B", "text": "5"}],
            "correctOptionId": "A",
            "marks": 2,
            "itemType": "QUESTION"
        })

        # Create a CODING Set
        table.put_item(Item={
            "questionSetId": "SET_CODING_01",
            "questionId": "METADATA",
            "title": "Technical Coding Round",
            "setType": "CODING",
            "itemType": "QUESTION_SET_HEADER"
        })
        table.put_item(Item={
            "questionSetId": "SET_CODING_01",
            "questionId": "Q001",
            "questionType": "CODING",
            "question": "Write a program to reverse a linked list.",
            "language": "python",
            "duration": 30,
            "marks": 10,
            "itemType": "QUESTION"
        })
            
        return {"message": "Successfully seeded independent MCQ and CODING sets!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mangum Handler for AWS Lambda
handler = Mangum(app)