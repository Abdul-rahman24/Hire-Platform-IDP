from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from question_bank_service import schemas
from question_bank_service.repository import QuestionRepository

app = FastAPI(
    title="IDP Question Bank Microservice",
    description="MVP for managing college placement questions using FastAPI & DynamoDB",
    version="1.0.0"
)

# Enable CORS for when your frontend team is ready to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/questions", response_model=schemas.QuestionResponseSchema, status_code=status.HTTP_201_CREATED)
def add_question(payload: schemas.QuestionCreateSchema):
    """Inserts a new question into a specific Question Set."""
    new_item = QuestionRepository.create_question(payload)
    return new_item

@app.get("/question-sets/{questionSetId}", response_model=schemas.QuestionSetResponseSchema)
def get_question_set(questionSetId: str):
    """
    Fetches all questions for a given Question Set ID.
    This is what the Test Configure service will hit!
    """
    questions = QuestionRepository.get_questions_by_set(questionSetId)
    if not questions:
        raise HTTPException(status_code=404, detail="Question Set not found or empty")
    return {"questionSetId": questionSetId, "questions": questions}


@app.post("/seed-demo")
def seed_demo_data():
    """Seeds the 5 initial Java questions required by your manager for the MVP."""
    demo_questions = [
        {"id": "Q001", "q": "What is JVM?", "opts": [{"optionId": "A", "text": "Java Virtual Machine"}, {"optionId": "B", "text": "Java Variable Method"}, {"optionId": "C", "text": "Java Version Manager"}, {"optionId": "D", "text": "Java Virtual Memory"}]},
        {"id": "Q002", "q": "What is JDK?", "opts": [{"optionId": "A", "text": "Java Development Kit"}, {"optionId": "B", "text": "Java Dynamic Kernel"}, {"optionId": "C", "text": "Java Deployment Key"}, {"optionId": "D", "text": "Java Data Kit"}]},
        {"id": "Q003", "q": "Which keyword is used to inherit a class in Java?", "opts": [{"optionId": "A", "text": "implements"}, {"optionId": "B", "text": "extends"}, {"optionId": "C", "text": "inherits"}, {"optionId": "D", "text": "super"}]},
        {"id": "Q004", "q": "What is the size of int in Java?", "opts": [{"optionId": "A", "text": "16 bit"}, {"optionId": "B", "text": "32 bit"}, {"optionId": "C", "text": "64 bit"}, {"optionId": "D", "text": "8 bit"}]},
        {"id": "Q005", "q": "Which of these is not a Java primitive type?", "opts": [{"optionId": "A", "text": "int"}, {"optionId": "B", "text": "float"}, {"optionId": "C", "text": "String"}, {"optionId": "D", "text": "char"}]},
    ]
    
    for item in demo_questions:
        data = schemas.QuestionCreateSchema(
            questionId=item["id"],
            questionSetId="SET001",
            question=item["q"],
            options=[schemas.OptionSchema(**opt) for opt in item["opts"]]
        )
        QuestionRepository.create_question(data)
        
    return {"status": "Success", "message": "5 Java Questions seeded into DynamoDB under set SET001"}

# This handler wraps FastAPI so AWS Lambda can understand API Gateway requests
handler = Mangum(app)