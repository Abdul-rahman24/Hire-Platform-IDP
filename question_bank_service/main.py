import os
import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from . import schemas
from .repository import QuestionRepository

app = FastAPI(
    title="Question Bank Microservice",
    description="Serverless Question Bank API for College Placement Platform",
    root_path="/default"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

DYNAMODB_TABLE_NAME = os.environ.get("TABLE_NAME", "QuestionBankTable_SW")
dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

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

@app.post("/questions", status_code=201, tags=["Questions"])
def create_question(payload: schemas.QuestionCreateSchema):
    try:
        item_data = QuestionRepository.create_question(payload)
        return {
            "message": f"Question {payload.questionId} added to {payload.questionSetId}",
            "data": item_data
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def update_question(questionSetId: str, questionId: str, payload: schemas.QuestionUpdateSchema):
    try:
        updated_item = QuestionRepository.update_question(questionSetId, questionId, payload)
        return {
            "message": "Question updated successfully!", 
            "data": updated_item
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/questions/{questionSetId}/{questionId}", tags=["Questions"])
def delete_question(questionSetId: str, questionId: str):
    try:
        table.delete_item(Key={"questionSetId": questionSetId, "questionId": questionId})
        return {"message": f"Question '{questionId}' deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/seed-demo", tags=["Developer Tools"])
def seed_demo_data():
    try:
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
            "marks": 10,
            "itemType": "QUESTION"
        })
        
        # New descriptive data block added here
        table.put_item(Item={
            "questionSetId": "SET_DESC_01",
            "questionId": "METADATA",
            "title": "HR Written Assessment",
            "setType": "DESCRIPTIVE",
            "itemType": "QUESTION_SET_HEADER"
        })
        table.put_item(Item={
            "questionSetId": "SET_DESC_01",
            "questionId": "Q001",
            "questionType": "DESCRIPTIVE",
            "question": "Describe a time you overcame a technical challenge.",
            "wordLimit": 500,
            "marks": 5,
            "itemType": "QUESTION"
        })
            
        return {"message": "Successfully seeded MCQ, CODING, and DESCRIPTIVE sets!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  
  
handler = Mangum(app)