# Test Configuration Service

A production-grade **FastAPI** microservice for creating and managing test configurations in the IDP Hire Platform. Built with Python, deployed on **AWS Lambda** via API Gateway, and backed by **Amazon DynamoDB**.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [Deployment to AWS Lambda](#deployment-to-aws-lambda)
- [Live API](#live-api)
- [Performance Optimizations](#performance-optimizations)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

The **Test Configuration Service** is responsible for:

- **Creating and managing tests** - Each test is identified by a UUID testId and an auto-generated 6-digit unique linkId.
- **Organizing test sections** - Each test can have multiple sections, each linked to a Question Bank Set.
- **Aggregating questions** - Questions are fetched live from the external **Question Bank Service** and embedded in the test response.
- **Dynamic question type resolution** - Automatically resolves MCQ or CODING question types from the Question Bank set metadata.

---

## Architecture

`
Client
  |
  v
Amazon API Gateway (REST)
  |
  v
AWS Lambda (test-configuration-service)
  |
  |-- FastAPI App (Mangum ASGI adapter)
  |     |-- Routes: /tests, /tests/{testId}/sections, /question-sets, /health
  |     |-- Services: TestService, SectionService
  |     |-- Repositories: DynamoDB (test-config-tests, test-config-sections)
  |
  |-- External: Question Bank Service (AWS API Gateway)
`

**DynamoDB Tables:**

| Table Name | Partition Key | Sort Key | Description |
|---|---|---|---|
| test-config-tests | testId (HASH) | SK = METADATA | Stores test metadata including linkId, testStatus |
| test-config-sections | sectionId (HASH) | SK = METADATA | Stores section metadata including questionType |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.13 |
| Framework | FastAPI 0.115 |
| ASGI Adapter | Mangum 0.17 (AWS Lambda) |
| Database | Amazon DynamoDB |
| Cloud | AWS Lambda + API Gateway (ap-southeast-1) |
| Validation | Pydantic v2 |
| AWS SDK | Boto3 1.34 |
| Testing | Pytest |

---

## Project Structure

`
test-configuration-service/
|-- app/
|   |-- api/
|   |   |-- router.py
|   |   |-- routes/
|   |       |-- health.py
|   |       |-- tests.py
|   |       |-- sections.py
|   |       |-- question_bank.py
|   |       |-- section_question_mappings.py
|   |-- core/
|   |   |-- config.py
|   |   |-- exceptions.py
|   |   |-- handlers.py
|   |   |-- logging.py
|   |-- dependencies/
|   |   |-- providers.py
|   |-- models/
|   |   |-- base.py
|   |   |-- test.py
|   |   |-- section.py
|   |   |-- section_question_mapping.py
|   |-- repositories/
|   |   |-- interfaces.py
|   |   |-- dynamodb_base.py
|   |   |-- test_repository.py
|   |   |-- section_repository.py
|   |   |-- section_question_mapping_repository.py
|   |-- schemas/
|   |   |-- test.py
|   |   |-- section.py
|   |   |-- question_bank.py
|   |   |-- health.py
|   |-- services/
|   |   |-- interfaces.py
|   |   |-- test_service.py
|   |   |-- section_service.py
|   |   |-- question_bank_service.py
|   |   |-- section_question_mapping_service.py
|   |-- utils/
|   |   |-- dynamodb.py
|   |   |-- question_bank_client.py
|   |-- main.py
|
|-- tests/
|   |-- test_health.py
|   |-- test_tests_api.py
|   |-- test_test_service.py
|   |-- test_repositories.py
|   |-- test_question_sets_api.py
|
|-- requirements.txt
|-- .gitignore
|-- README.md
`

---

## API Endpoints

**Base URL:** https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com

### Health Check

| Method | Path | Description |
|---|---|---|
| GET | /health | Service health status |
| GET | / | Root endpoint info |

### Tests

| Method | Path | Description |
|---|---|---|
| POST | /tests | Create a new test (auto-generates linkId) |
| GET | /tests | List all tests |
| GET | /tests/{testId} | Get test with sections and questions |
| PUT | /tests/{testId} | Update a test |
| DELETE | /tests/{testId} | Delete a test and its sections |

### Sections

| Method | Path | Description |
|---|---|---|
| POST | /tests/{testId}/sections | Add a section to a test |
| GET | /tests/{testId}/sections | List all sections for a test |
| GET | /tests/{testId}/sections/{sectionId} | Get a specific section |
| PUT | /tests/{testId}/sections/{sectionId} | Update a section |
| DELETE | /tests/{testId}/sections/{sectionId} | Delete a section |

### Question Sets

| Method | Path | Description |
|---|---|---|
| GET | /question-sets | List available question sets |
| GET | /question-sets/{questionSetId} | Get a specific question set |

---

## Data Models

### Create Test Request (POST /tests)

`json
{
  "title": "Full Stack Technical Assessment",
  "description": "Mid-semester evaluation",
  "status": "published",
  "durationMinutes": 120,
  "totalMarks": 100
}
`

> Note: linkId and testStatus are auto-generated. Do NOT include them in the request body.

### Test Response

`json
{
  "testId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "linkId": "748291",
  "title": "Full Stack Technical Assessment",
  "description": "Mid-semester evaluation",
  "status": "published",
  "testStatus": "Active",
  "durationMinutes": 120,
  "totalMarks": 100,
  "totalSections": 2,
  "totalDurationMinutes": 90,
  "createdAt": "2026-08-12T07:00:00Z",
  "updatedAt": "2026-08-12T07:00:00Z",
  "sections": []
}
`

### Create Section Request (POST /tests/{testId}/sections)

`json
{
  "sectionName": "Core Java MCQ",
  "questionSetId": "SET001",
  "durationMinutes": 30,
  "marks": 40,
  "order": 1,
  "shuffleQuestions": true,
  "shuffleOptions": true
}
`

> Note: questionType (MCQ or CODING) is auto-detected from the Question Bank set metadata.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| APP_NAME | Test Configuration Service | Application name |
| APP_ENV | local | Environment: local, development, staging, production |
| APP_DEBUG | false | Enable debug mode |
| APP_HOST | 0.0.0.0 | Bind host (local dev only) |
| APP_PORT | 8000 | Bind port (local dev only) |
| APP_LOG_LEVEL | INFO | Logging level |
| APP_CORS_ORIGINS | ["*"] | Allowed CORS origins |
| AWS_REGION | ap-southeast-1 | AWS region for DynamoDB |
| DYNAMODB_TABLE_PREFIX | test-config | DynamoDB table name prefix |
| DYNAMODB_ENDPOINT_URL | None | Override DynamoDB endpoint (for LocalStack) |
| QUESTION_SERVICE_URL | (QB Service URL) | Base URL of the Question Bank Service |

---

## Local Development

### Prerequisites

- Python 3.13+
- pip package manager

### Setup

`ash
# 1. Clone the repository
git clone https://github.com/NMathanKumar/idp_test_service.git
cd test-configuration-service

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt
pip install pydantic-settings uvicorn

# 4. Run locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
`

### Access Swagger UI

`
http://localhost:8000/docs
`

---

## Running Tests

All 23 unit and integration tests run without any AWS credentials:

`ash
# Run all tests
python -m pytest tests/ -v

# Run a specific test file
python -m pytest tests/test_test_service.py -v

# Run with short traceback
python -m pytest tests/ -v --tb=short
`

### Test Coverage

| Test File | What It Tests |
|---|---|
| test_health.py | Root endpoint, health check, 500 error handler |
| test_tests_api.py | POST, GET, PUT, DELETE /tests endpoints |
| test_test_service.py | TestService (linkId generation, testStatus) and SectionService (question type auto-detection) |
| test_repositories.py | DynamoDB repository CRUD and error handling |
| test_question_sets_api.py | Question Bank external service integration |

**Expected output:**
`
======================= 23 passed, 5 warnings in 2.25s ========================
`

---

## Deployment to AWS Lambda

### Prerequisites

- Fresh AWS Academy credentials from Learner Lab
- boto3 installed

### Deploy Script

`python
import os, shutil, zipfile, boto3

# Build Lambda package
package_dir = '.build-lambda/package'
pkg_app = os.path.join(package_dir, 'app')
if os.path.exists(pkg_app):
    shutil.rmtree(pkg_app)
shutil.copytree('app', pkg_app)

with zipfile.ZipFile('lambda.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(package_dir):
        for f in files:
            full_path = os.path.join(root, f)
            z.write(full_path, os.path.relpath(full_path, package_dir))

# Upload to Lambda
lambda_client = boto3.client('lambda', region_name='ap-southeast-1')
with open('lambda.zip', 'rb') as f:
    lambda_client.update_function_code(
        FunctionName='test-configuration-service',
        ZipFile=f.read()
    )
print('Deployment complete!')
`

---

## Live API

| Property | Value |
|---|---|
| Base URL | https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com |
| Swagger UI | https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com/docs |
| Health Check | https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com/health |
| AWS Account | 726101441380 (AWS Academy) |
| AWS Region | ap-southeast-1 (Singapore) |

---

## Performance Optimizations

### 1. In-Memory TTL Caching
Question Bank set metadata is cached in memory for 60 seconds. Repeated requests for the same question set are served from RAM in less than 1ms instead of making remote HTTP calls.

### 2. Parallel Section Question Fetching
For multi-section tests, questions are fetched concurrently using ThreadPoolExecutor (max_workers=5), reducing response latency by up to 70% for tests with multiple sections.

### 3. GZip Response Compression
JSON responses over 500 bytes are automatically GZip-compressed via GZipMiddleware, reducing network payload size by up to 80%.

### 4. Fast linkId Generation
The 6-digit unique linkId is generated using secrets.randbelow() — a cryptographically secure O(1) operation with no DynamoDB table scan.

### Benchmark Results

| Metric | Before Optimization | After Optimization |
|---|---|---|
| Average API Latency (GET /tests/{id}) | 928.92 ms | 565.85 ms |
| Best Warm Response Time | 595.74 ms | 488.49 ms |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| testId stays as UUID | Globally unique, collision-proof, industry standard |
| linkId is 6-digit numeric | Short and human-readable for sharing test links |
| linkId auto-generated | Users should not manually input or manage link IDs |
| testStatus defaults to Active | Tests are immediately usable after creation |
| questionType auto-detected | Reduces user input friction; derived from Question Bank metadata |
| Fallback question sets | Service stays resilient if the Question Bank Service is temporarily down |

---

## Authors

- **Mathankumar Natesan** - Backend Developer, IDP Team
- **Abdul Rahman** - Platform Lead

## Repository

- **Origin:** https://github.com/NMathanKumar/idp_test_service
- **Platform Repo:** https://github.com/Abdul-rahman24/Hire-Platform-IDP
- **Active Branch:** main (merged from test_config)
