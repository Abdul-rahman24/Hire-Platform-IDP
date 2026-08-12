# Question Bank Service

A production-grade **serverless Question Bank Microservice** built with **FastAPI**, **AWS Lambda**, and **DynamoDB** for managing assessment question sets in an online recruitment platform.

Designed for scalability, cost efficiency, and clean REST APIs, this service enables administrators to create, manage, and maintain assessment question banks while exposing a stateless API for frontend applications.

---

## Features

* **Multi-Format Question Support (NEW):** Seamlessly handle Multiple Choice (MCQ), Technical Coding, and Descriptive (Essay) questions.
* **Create and manage Question Sets**.


* **CRUD operations for Questions**.


* **Serverless architecture using AWS Lambda**.


* **FastAPI with automatic Swagger/OpenAPI documentation**.


* **Pydantic v2 request & response validation**, including dynamic auto-scrubbing for mismatched question attributes.


* **DynamoDB Single Table Design**.


* **Batch deletion of complete Question Sets**.


* **Automatic default marks assignment**.


* **Production-ready modular architecture** with CI/CD automation.



---

## Architecture

```text
                   React / Vue Frontend
                           │
                           │ HTTPS REST API
                           ▼
                  Amazon API Gateway
                           │
                           ▼
                 AWS Lambda (Python)
                           │
                      Mangum Adapter
                           │
                           ▼
                     FastAPI Application
                           │
                  Business Service Layer (Validation & Routing)
                           │
                     Repository Layer (Data Access & Scrubbing)
                           │
                           ▼
                     Amazon DynamoDB

```

---

## Technology Stack

| Technology | Purpose |
| --- | --- |
| **Python 3.13** | Backend Runtime

 |
| **FastAPI** | REST API Framework

 |
| **Mangum** | AWS Lambda Adapter

 |
| **Pydantic v2** | Data Validation & Dynamic Scrubbing

 |
| **DynamoDB** | NoSQL Database

 |
| **Boto3** | AWS SDK

 |
| **AWS Lambda** | Serverless Compute

 |
| **pytest & moto** | Unit Testing & Mocking AWS |
| **GitHub Actions** | CI/CD Pipeline Automation |
| **SonarCloud & Snyk** | Code Quality & Vulnerability Scanning |

---

## Database Design

The service follows a **Single Table Design** in DynamoDB.

### Primary Keys

| Attribute | Description |
| --- | --- |
| **questionSetId** | Partition Key

 |
| **questionId** | Sort Key

 |

### Entity Structure Example

```text
SET_CODING_01 (Partition Key)
 ├── METADATA (Sort Key) -> Contains setType="CODING", title, etc.
 ├── Q001 (Sort Key)     -> Question data
 ├── Q002 (Sort Key)
 └── Q003 (Sort Key)

```

This design provides faster querying, better scalability, lower DynamoDB costs, no joins, easy pagination, and concurrent editing support.

---

## Validation & Auto-Scrubbing

Pydantic v2 automatically validates request bodies, response schemas, required fields, and default values.

The microservice features a dynamic strict-schema validator:

* **MCQ:** Requires `options` and `correctOptionId`. Auto-scrubs `language` and `wordLimit`.
* **CODING:** Requires `language`. Auto-scrubs `options`, `correctOptionId`, and `wordLimit`.
* **DESCRIPTIVE:** Accepts an optional `wordLimit`. Auto-scrubs `options`, `correctOptionId`, and `language`.

(Example: If marks are omitted, the backend automatically assigns a default value of **2**).

---

## API Endpoints

### 1. Question Sets

* **Create Question Set:** `POST /question-sets`

```json
{
  "questionSetId": "SET_DESC_01",
  "setType": "DESCRIPTIVE"
}

```


* **Get Question Set:** `GET /question-sets/{questionSetId}` (Returns Metadata, Total questions, and the Question list).


* **Delete Question Set:** `DELETE /question-sets/{questionSetId}` (Deletes Metadata and all associated questions via batch writer).



### 2. Questions

* **Create Question:** `POST /questions`

* **Get Question:** `GET /questions/{questionSetId}/{questionId}`

* **Update Question:** `PUT /questions/{questionSetId}/{questionId}`

* **Delete Question:** `DELETE /questions/{questionSetId}/{questionId}`


### 3. Developer Tools

* **Demo Seeder:** `POST /seed-demo`


*(Automatically inserts sample MCQ, Coding, and Descriptive Question Sets into the database).*

---

## Sample Question Payloads

### MCQ Format

```json
{
  "questionId": "Q001",
  "questionSetId": "SET_MCQ_01",
  "questionType": "MCQ",
  "question": "What is JVM?",
  "options": [
    {"optionId": "A", "text": "Java Virtual Machine"},
    {"optionId": "B", "text": "Java Variable Method"}
  ],
  "correctOptionId": "A",
  "marks": 2
}

```

### Technical Coding Format

```json
{
  "questionId": "Q002",
  "questionSetId": "SET_CODING_01",
  "questionType": "CODING",
  "question": "Write a program to reverse a linked list.",
  "language": "python",
  "marks": 10
}

```

### Descriptive / Essay Format

```json
{
  "questionId": "Q003",
  "questionSetId": "SET_DESC_01",
  "questionType": "DESCRIPTIVE",
  "question": "Describe a time you overcame a technical challenge.",
  "wordLimit": 500,
  "marks": 5
}

```

---

## Running Locally

**Clone Repository**

```bash
git clone <repository-url>
cd question-bank-service

```

**Install Dependencies**

```bash
pip install -r requirements.txt

```

**Set Environment Variable & Start Server**

```bash
export TABLE_NAME="QuestionBankTable_SW" 
uvicorn question_bank_service.main:app --reload

```

* **Swagger UI:** `http://localhost:8000/docs`

* **ReDoc:** `http://localhost:8000/redoc`


---

## CI/CD & Quality Assurance

This repository includes a fully automated CI/CD pipeline triggered via **GitHub Actions**:

* **Security Scanning:** Snyk automatically tests `requirements.txt` to block high-severity vulnerabilities before deployment.
* **Unit Testing:** Pytest and `moto` execute test suites within a completely mocked AWS DynamoDB environment.
* **Code Quality:** SonarCloud integration tracks test coverage (`coverage.xml`), bugs, and code smells.
* **Automated AWS Deployment:** Packages the FastAPI app with dependencies natively and updates the Lambda function via AWS CLI upon a successful merge.

---

## AWS Deployment

Deploy using AWS Lambda, Amazon API Gateway, and DynamoDB.

* **Lambda Handler:** `question_bank_service.main.handler`

* **Environment Variable:** `TABLE_NAME=QuestionBankTable_SW`

* **API Gateway Stage:** `/default`

* **FastAPI Configuration:** `app = FastAPI(root_path="/default")`


---

## Design Decisions

* **Why FastAPI?** High performance, Async support, Automatic Swagger, Built-in validation.


* **Why DynamoDB?** Fully managed, Low latency, Infinite scalability, Pay-per-request pricing.


* **Why Serverless?** Zero idle cost, Automatic scaling, Minimal maintenance, High availability.


* **Why Single Table Design?** Instead of storing an entire assessment in one large JSON document, each question is stored as an independent record. This avoids DynamoDB 400 KB item limits, enables faster updates, reduces read/write costs, eliminates race conditions, and simplifies pagination.



---

## Future Enhancements

* JWT Authentication


* Role-Based Access Control (RBAC)


* Question Versioning


* Bulk Import (Excel/CSV)


* Pagination, Tags & Categories, Difficulty Levels



---

## License

This project is developed as part of a Recruitment Platform backend and is intended for educational and enterprise learning purposes.

---

## Author

**Syed Abdul Rahman**

Project Intern

IDP Education

Backend Developer | FastAPI | AWS | DynamoDB | Serverless Architecture