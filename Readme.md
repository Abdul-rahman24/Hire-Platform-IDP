# Question Bank Service

A production-grade **serverless Question Bank Microservice** built with **FastAPI**, **AWS Lambda**, and **DynamoDB** for managing assessment question sets in an online recruitment platform.

Designed for scalability, cost efficiency, and clean REST APIs, this service enables administrators to create, manage, and maintain assessment question banks while exposing a stateless API for frontend applications.

---

## Features

- Create and manage Question Sets
- CRUD operations for Questions
- Serverless architecture using AWS Lambda
- FastAPI with automatic Swagger/OpenAPI documentation
- Pydantic v2 request & response validation
- DynamoDB Single Table Design
- Batch deletion of complete Question Sets
- Automatic default marks assignment
- RESTful API design
- Production-ready modular architecture

---

# Architecture

```
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
                  Business Service Layer
                           │
                     Repository Layer
                           │
                           ▼
                     Amazon DynamoDB
```

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| Python 3.13 | Backend Runtime |
| FastAPI | REST API Framework |
| Mangum | AWS Lambda Adapter |
| Pydantic v2 | Data Validation |
| DynamoDB | NoSQL Database |
| Boto3 | AWS SDK |
| AWS Lambda | Serverless Compute |
| API Gateway | API Management |
| Uvicorn | Local Development Server |

---

# Project Structure

```
question_bank_service/
│
├── main.py
├── config.py
├── schemas.py
├── repository.py
├── routes/
├── services/
├── models/
├── utils/
│
├── requirements.txt
└── README.md
```

---

# Database Design

The service follows a **Single Table Design** in DynamoDB.

### Primary Keys

| Attribute | Description |
|-----------|-------------|
| questionSetId | Partition Key |
| questionId | Sort Key |

Example

```
SET001
 ├── METADATA
 ├── Q001
 ├── Q002
 ├── Q003
 └── Q004
```

This design provides

- Faster querying
- Better scalability
- Lower DynamoDB cost
- No joins
- Easy pagination
- Concurrent editing support

---

# API Endpoints

## Question Sets

### Create Question Set

```
POST /question-sets
```

Request

```json
{
  "questionSetId": "SET001"
}
```

---

### Get Question Set

```
GET /question-sets/{questionSetId}
```

Returns

- Metadata
- Total questions
- Question list

---

### Delete Question Set

```
DELETE /question-sets/{questionSetId}
```

Deletes

- Metadata
- All associated questions

---

## Questions

### Create Question

```
POST /questions
```

---

### Get Question

```
GET /questions/{questionSetId}/{questionId}
```

---

### Update Question

```
PUT /questions/{questionSetId}/{questionId}
```

---

### Delete Question

```
DELETE /questions/{questionSetId}/{questionId}
```

---

## Demo Seeder

```
POST /seed-demo
```

Automatically inserts

- Sample Question Set
- Demo Java Questions

---

# Sample Question

```json
{
  "questionSetId": "SET001",
  "questionId": "Q001",
  "question": "What is JVM?",
  "options": [
    "Java Virtual Machine",
    "Java Variable Method",
    "Java Visual Module",
    "None"
  ],
  "correctOption": 1,
  "marks": 2
}
```

---

# Running Locally

## Clone Repository

```bash
git clone <repository-url>

cd question-bank-service
```

Install Dependencies

```bash
pip install -r requirements.txt
```

Start Server

```bash
uvicorn question_bank_service.main:app --reload
```

Swagger

```
http://localhost:8000/docs
```

ReDoc

```
http://localhost:8000/redoc
```

---

# AWS Deployment

Deploy using

- AWS Lambda
- Amazon API Gateway
- DynamoDB

Lambda Handler

```
question_bank_service.main.handler
```

Environment Variable

```
TABLE_NAME=QuestionBankTable
```

API Gateway Stage

```
/default
```

FastAPI Configuration

```python
app = FastAPI(root_path="/default")
```

---

# Design Decisions

## Why FastAPI?

- High performance
- Async support
- Automatic Swagger
- Built-in validation

---

## Why DynamoDB?

- Fully managed
- Low latency
- Infinite scalability
- Pay-per-request pricing

---

## Why Serverless?

- Zero idle cost
- Automatic scaling
- Minimal maintenance
- High availability

---

## Why Single Table Design?

Instead of storing an entire assessment in one large JSON document, each question is stored as an independent record.

Benefits

- Avoids DynamoDB 400 KB item limit
- Faster updates
- Reduced read/write costs
- No race conditions
- Easy pagination

---

# Validation

Pydantic automatically validates

- Request body
- Response schema
- Required fields
- Default values

Example

```python
marks = 2
```

If marks are omitted, the backend automatically assigns a value of **2**.

---

# Future Enhancements

- JWT Authentication
- Role-Based Access Control (RBAC)
- Question Versioning
- Bulk Import (Excel/CSV)
- Question Search
- Pagination
- Difficulty Levels
- Tags & Categories
- Image Upload Support
- Audit Logging
- Unit & Integration Tests
- CI/CD Pipeline
- Docker Support
- Terraform Deployment

---

# Performance Highlights

- Stateless REST APIs
- Serverless architecture
- Optimized DynamoDB queries
- Batch deletion support
- Scalable for campus recruitment
- Low operational cost

---

# License

This project is developed as part of a Recruitment Platform backend and is intended for educational and enterprise learning purposes.

---

# Author

**Syed Abdul Rahman**

Project Intern

IDP Education

Backend Developer | FastAPI | AWS | DynamoDB | Serverless Architecture