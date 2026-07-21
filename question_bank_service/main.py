import os
import boto3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from mangum import Mangum

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

# Set Creation Schema (Simplified to just Set ID)
class QuestionSetCreate(BaseModel):
    questionSetId: str = Field(..., example="SET001", description="Unique ID for the question set")

# Question Creation Schema
class QuestionCreate(BaseModel):
    questionId: str = Field(..., example="Q001")
    questionSetId: str = Field(..., example="SET001")
    question: str = Field(..., example="What is JVM?")
    options: List[Option]
    correctOptionId: str = Field(..., example="A")
    marks: int = Field(2, example=2, description="Marks assigned to this question")

# Question Update Schema
class QuestionUpdate(BaseModel):
    question: str = Field(..., example="What does JVM stand for in Java?")
    options: List[Option]
    correctOptionId: str = Field(..., example="A")
    marks: int = Field(2, example=2, description="Marks assigned to this question")

# ==========================================
# 2. API ENDPOINTS
# ==========================================

# 1. Create Question Set (Simplified Workflow)
@app.post("/question-sets", status_code=201, tags=["Question Sets"])
def create_question_set(payload: QuestionSetCreate):
    try:
        item = {
            "questionSetId": payload.questionSetId,
            "questionId": "METADATA",
            "title": f"Assessment Set: {payload.questionSetId}",
            "itemType": "QUESTION_SET_HEADER"
        }
        table.put_item(Item=item)
        return {
            "message": f"Question Set '{payload.questionSetId}' created successfully!",
            "data": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 2. Fetch all Questions in a Set
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


# NEW ENDPOINT: 3. Delete an Entire Question Set (Header + All Questions)
@app.delete("/question-sets/{questionSetId}", tags=["Question Sets"])
def delete_question_set(questionSetId: str):
    try:
        # Step 1: Query all items belonging to this Question Set
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("questionSetId").eq(questionSetId),
            ProjectionExpression="questionSetId, questionId"
        )
        items = response.get("Items", [])
        
        if not items:
            raise HTTPException(
                status_code=404, 
                detail=f"Question Set '{questionSetId}' not found or already empty."
            )
            
        # Step 2: Delete all matching rows using DynamoDB Batch Writer
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(
                    Key={
                        "questionSetId": item["questionSetId"],
                        "questionId": item["questionId"]
                    }
                )
                
        return {
            "message": f"Successfully deleted Question Set '{questionSetId}' and all its {len(items)} associated items (metadata and questions).",
            "deletedCount": len(items),
            "questionSetId": questionSetId
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. Fetch a SINGLE Question (For filling the Frontend Edit Form)
@app.get("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def get_single_question(questionSetId: str, questionId: str):
    try:
        response = table.get_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        if "Item" not in response or response["Item"].get("questionId") == "METADATA":
            raise HTTPException(status_code=404, detail=f"Question '{questionId}' not found in set '{questionSetId}'")
        
        return {
            "message": "Question retrieved successfully",
            "data": response["Item"]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. Add a Question inside a Set
@app.post("/questions", status_code=201, tags=["Questions"])
def create_question(payload: QuestionCreate):
    try:
        item_data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
        item_data["itemType"] = "QUESTION"
        
        table.put_item(Item=item_data)
        return {
            "message": f"Question {payload.questionId} added to set {payload.questionSetId} (Marks: {payload.marks})",
            "data": item_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. Update Existing Question
@app.put("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def update_question(questionSetId: str, questionId: str, payload: QuestionUpdate):
    try:
        existing_item = table.get_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        if "Item" not in existing_item:
            raise HTTPException(
                status_code=404, 
                detail=f"Cannot update: Question '{questionId}' not found in set '{questionSetId}'"
            )

        updated_item = {
            "questionSetId": questionSetId,
            "questionId": questionId,
            "question": payload.question,
            "options": [opt.model_dump() if hasattr(opt, "model_dump") else opt.dict() for opt in payload.options],
            "correctOptionId": payload.correctOptionId,
            "marks": payload.marks,
            "itemType": "QUESTION"
        }
        
        table.put_item(Item=updated_item)
        
        return {
            "message": f"Question '{questionId}' in set '{questionSetId}' updated successfully!",
            "data": updated_item
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 7. Delete Single Question
@app.delete("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def delete_question(questionSetId: str, questionId: str):
    try:
        table.delete_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        return {"message": f"Question '{questionId}' deleted successfully from set '{questionSetId}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 8. Seed Demo Data
@app.post("/seed-demo", tags=["Developer Tools"])
def seed_demo_data():
    try:
        table.put_item(Item={
            "questionSetId": "SET001",
            "questionId": "METADATA",
            "title": "Assessment Set: SET001",
            "itemType": "QUESTION_SET_HEADER"
        })
        
        sample_questions = [
            {
                "questionSetId": "SET001",
                "questionId": f"Q00{i}",
                "question": f"Sample Java Technical Question {i}?",
                "options": [
                    {"optionId": "A", "text": f"Option A for Q{i}"},
                    {"optionId": "B", "text": f"Option B for Q{i}"},
                    {"optionId": "C", "text": f"Option C for Q{i}"},
                    {"optionId": "D", "text": f"Option D for Q{i}"}
                ],
                "correctOptionId": "A",
                "marks": 2,
                "itemType": "QUESTION"
            } for i in range(1, 6)
        ]
        
        for q in sample_questions:
            table.put_item(Item=q)
            
        return {"message": "Successfully seeded 1 Question Set and 5 Demo Questions (2 marks each)!", "questionSetId": "SET001"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW ENDPOINT: List All Available Question Sets
@app.get("/question-sets", tags=["Question Sets"])
def list_all_question_sets():
    try:
        # Perform a Filtered Scan to retrieve ONLY the header metadata rows
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

# Mangum Handler for AWS Lambda
handler = Mangum(app)