# Test Configuration Service

[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange)](https://aws.amazon.com/lambda/)
[![Tests](https://img.shields.io/badge/Tests-23%20Passed-brightgreen)](https://pytest.org)

> A production-grade FastAPI microservice for creating and managing test configurations in the IDP Hire Platform.

**Live URLs:**
- Swagger UI: https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com/docs
- Health Check: https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com/health

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Request Flow Diagrams](#request-flow-diagrams)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Data Models and Entity Relationships](#data-models-and-entity-relationships)
7. [API Reference](#api-reference)
8. [Error Handling](#error-handling)
9. [Environment Variables](#environment-variables)
10. [Local Development](#local-development)
11. [Running Tests](#running-tests)
12. [Deployment](#deployment)
13. [Performance Optimizations](#performance-optimizations)
14. [Key Design Decisions](#key-design-decisions)
15. [Contributing](#contributing)

---

## Overview

The **Test Configuration Service** manages the complete lifecycle of test creation and delivery:

| Feature | Description |
|---|---|
| Test Creation | Creates tests with auto-generated UUID testId and 6-digit linkId |
| Section Management | Organizes tests into ordered sections linked to question sets |
| Question Aggregation | Fetches and embeds live questions from the Question Bank Service |
| Auto Type Detection | Resolves MCQ or CODING type from Question Bank metadata automatically |
| Candidate Sharing | Short 6-digit linkId enables easy sharing with candidates |

### Key Business Rules

- Every test gets a **36-char UUID testId** (globally unique)
- Every test gets a **6-digit numeric linkId** auto-generated (e.g. `748291`)
- `testStatus` always defaults to `Active` on creation
- `questionType` is **never manually entered** — resolved from Question Bank automatically
- Deleting a test **cascades** to delete all its sections

---

## System Architecture

```
+------------------+         HTTPS          +------------------------+
|     Client       +----------------------->+   Amazon API Gateway   |
| (Frontend/Mobile)|                        |       REST API         |
+------------------+                        +----------+-------------+
                                                       |
                                                  Invoke Lambda
                                                       |
                                            +----------v-------------+
                                            |     AWS Lambda         |
                                            | test-configuration-    |
                                            |      service           |
                                            |                        |
                                            |  +------------------+  |
                                            |  |  FastAPI (Mangum)|  |
                                            |  +--------+---------+  |
                                            |           |            |
                                            |  +--------v---------+  |
                                            |  |  Business Logic  |  |
                                            |  |  (Services)      |  |
                                            |  +--------+---------+  |
                                            |           |            |
                                            |  +--------v---------+  |
                                            |  |  Repositories    |  |
                                            +------+----------+------+
                                                   |          |
                                       +-----------+          +-----------+
                                       |                                  |
                              +--------v---------+           +------------v------+
                              |    DynamoDB      |           | Question Bank     |
                              | test-config-tests|           | Service           |
                              | test-config-     |           | (External API)    |
                              |   sections       |           +-------------------+
                              +------------------+
```

### AWS Infrastructure

```
AWS Account : 726101441380 (AWS Academy)
AWS Region  : ap-southeast-1 (Singapore)

[API Gateway]  utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com
      |
      +--> [Lambda]   test-configuration-service (Python 3.13 runtime)
                |
                +--> [DynamoDB] test-config-tests     (test metadata)
                +--> [DynamoDB] test-config-sections  (section metadata)
                +--> [HTTP]     Question Bank Service (external)
```

---

## Request Flow Diagrams

### Flow 1 — Create Test (POST /tests)

```
Client                API Gateway          TestService              DynamoDB
  |                       |                    |                       |
  |--- POST /tests ------->|                   |                       |
  |    {title, desc}      |                    |                       |
  |                       |--- Invoke -------->|                       |
  |                       |               1. Validate payload         |
  |                       |               2. Generate UUID testId     |
  |                       |               3. Generate 6-digit linkId  |
  |                       |               4. Set testStatus = Active  |
  |                       |                    |                       |
  |                       |                    |--- PutItem ---------->|
  |                       |                    |<-- OK ----------------|
  |                       |<-- 201 Created -----|                      |
  |<-- 201 Created --------|                   |                       |
  |   {testId, linkId,    |                    |                       |
  |    testStatus:Active}  |                   |                       |
```

### Flow 2 — Get Full Test (GET /tests/{testId})

```
Client        API Gateway      TestService       DynamoDB     QB Service
  |               |                |                |               |
  |-- GET -------->|               |                |               |
  |               |-- Invoke ----->|                |               |
  |               |           1. GetItem testId     |               |
  |               |                |--- GetItem --->|               |
  |               |                |<-- testEntity--|               |
  |               |           2. Query sections     |               |
  |               |                |--- Query ----->|               |
  |               |                |<-- [sections]--|               |
  |               |           3. Parallel fetch questions           |
  |               |                |-------- GET /qsets/id1 ------->|
  |               |                |-------- GET /qsets/id2 ------->|
  |               |                |<------- {questions} -----------|
  |               |                |<------- {questions} -----------|
  |               |           4. Assemble + sort sections           |
  |               |<-- 200 OK -----|                |               |
  |<-- 200 OK -----|               |                |               |
  |  {sections +  |                |                |               |
  |   questions}  |                |                |               |
```

### Flow 3 — Add Section (POST /tests/{testId}/sections)

```
Client      API Gateway    SectionService     DynamoDB   QB Service
  |              |               |               |            |
  |-- POST ------>|              |               |            |
  | {sectionName, |              |               |            |
  |  questionSetId}              |               |            |
  |              |-- Invoke ---->|               |            |
  |              |          1. Verify testId     |            |
  |              |               |-- GetItem --->|            |
  |              |               |<-- testEntity-|            |
  |              |          2. Fetch QB set      |            |
  |              |               |--- GET /question-sets/---->|
  |              |               |<--- {type: MCQ/CODING} ----|
  |              |          3. Auto-detect questionType       |
  |              |          4. Save section      |            |
  |              |               |-- PutItem --->|            |
  |              |               |<-- OK --------|            |
  |              |<-- 201 -------|               |            |
  |<-- 201 -------|              |               |            |
  | {sectionId,  |               |               |            |
  |  questionType:MCQ}           |               |            |
```

### Flow 4 — linkId Auto-Generation Logic

```
POST /tests {title: "..."}
    |
    v
[TestService.create_test()]
    |
    |-- Step 1: Generate testId
    |         uuid4() --> "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    |
    |-- Step 2: Generate linkId
    |         secrets.randbelow(900000) + 100000
    |         --> "748291"  (always 6 digits, range 100000-999999)
    |         No DynamoDB scan needed (O(1) operation)
    |
    |-- Step 3: Force testStatus = "Active"
    |         (regardless of what client sends)
    |
    |-- Step 4: PutItem to DynamoDB
    |
    v
201 Response: {testId, linkId: "748291", testStatus: "Active"}
```

### Flow 5 — Question Type Auto-Detection

```
POST /tests/{id}/sections {questionSetId: "SET001"}
    |
    v
[SectionService.create_section()]
    |
    |-- Call QuestionBankClient.get_question_set("SET001")
    |       Cache hit?  --> return from RAM (<1ms)
    |       Cache miss? --> HTTP GET to QB Service (~400ms), then cache
    |       QB down?    --> return from fallback dict
    |
    |-- _extract_question_type_from_set(set_data)
    |       read: set_data.get("type") or set_data.get("questionType")
    |
    |       Mapping:
    |         "MCQ", "MULTIPLE_CHOICE", "multiple_choice"  -->  "MCQ"
    |         "CODING", "coding", "code"                   -->  "CODING"
    |         anything else                                -->  "MCQ"
    |
    v
SectionEntity saved with questionType = "MCQ"
201 Response: {sectionId, questionType: "MCQ", ...}
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Python | 3.13 | Core runtime |
| Framework | FastAPI | 0.115 | HTTP routing and OpenAPI |
| ASGI Adapter | Mangum | 0.17 | AWS Lambda bridge |
| Validation | Pydantic | v2 | Request/response schemas |
| AWS SDK | Boto3 | 1.34 | DynamoDB access |
| Database | Amazon DynamoDB | - | NoSQL persistent storage |
| Compute | AWS Lambda | - | Serverless execution |
| Gateway | Amazon API Gateway | REST | Public HTTP entrypoint |
| Testing | Pytest | 8.4 | Unit and integration tests |
| Compression | GZipMiddleware | built-in | Response size reduction |
| Concurrency | ThreadPoolExecutor | stdlib | Parallel question fetch |

---

## Project Structure

```
test-configuration-service/
|
|-- app/
|   |-- api/
|   |   |-- router.py                 # Mounts all sub-routers
|   |   |-- routes/
|   |       |-- health.py             # GET / and GET /health
|   |       |-- tests.py              # /tests CRUD
|   |       |-- sections.py           # /tests/{id}/sections CRUD
|   |       |-- question_bank.py      # /question-sets
|   |       |-- section_question_mappings.py
|   |
|   |-- core/
|   |   |-- config.py                 # Env vars via Pydantic Settings
|   |   |-- exceptions.py             # Custom exceptions
|   |   |-- handlers.py               # Global error handlers
|   |   |-- logging.py                # Structured logging
|   |
|   |-- dependencies/
|   |   |-- providers.py              # FastAPI Depends factories
|   |
|   |-- models/
|   |   |-- base.py                   # BaseEntity: id, created_at, updated_at
|   |   |-- test.py                   # TestEntity (maps to DynamoDB row)
|   |   |-- section.py                # SectionEntity
|   |   |-- section_question_mapping.py
|   |
|   |-- repositories/
|   |   |-- interfaces.py             # Repository contracts
|   |   |-- dynamodb_base.py          # Base DynamoDB CRUD
|   |   |-- test_repository.py        # test-config-tests table
|   |   |-- section_repository.py     # test-config-sections table
|   |   |-- section_question_mapping_repository.py
|   |
|   |-- schemas/
|   |   |-- test.py                   # TestCreateRequest, TestResponse etc.
|   |   |-- section.py                # SectionCreateRequest, SectionResponse
|   |   |-- question_bank.py          # QuestionSetResponse
|   |   |-- health.py                 # HealthResponse
|   |
|   |-- services/
|   |   |-- interfaces.py             # Service contracts
|   |   |-- test_service.py           # TestService: business logic
|   |   |-- section_service.py        # SectionService + type detection
|   |   |-- question_bank_service.py  # QB integration
|   |   |-- section_question_mapping_service.py
|   |
|   |-- utils/
|   |   |-- dynamodb.py               # Boto3 DynamoDB client wrapper
|   |   |-- question_bank_client.py   # HTTP client + TTL cache + fallback
|   |
|   |-- main.py                       # FastAPI app + GZip + CORS + Mangum
|
|-- tests/
|   |-- test_health.py                # 4 tests - health endpoints
|   |-- test_tests_api.py             # 6 tests - /tests CRUD
|   |-- test_test_service.py          # 4 tests - service unit tests
|   |-- test_repositories.py          # 6 tests - repository layer
|   |-- test_question_sets_api.py     # 3 tests - QB integration
|
|-- requirements.txt
|-- .gitignore
|-- README.md
```

---

## Data Models and Entity Relationships

### Entity Relationship Diagram

```
+-------------------+      1 : N      +----------------------+
|   TestEntity      +---------------->+   SectionEntity      |
|-------------------|                 |----------------------|
| PK: testId (UUID) |                 | PK: sectionId (UUID) |
| SK: METADATA      |                 | SK: METADATA         |
|-------------------|                 |----------------------|
| title             |                 | testId  (FK)         |
| description       |                 | sectionName          |
| status            |                 | questionSetId        |
| testStatus        |                 | questionType         |
| linkId (6-digit)  |                 | durationMinutes      |
| durationMinutes   |                 | marks                |
| totalMarks        |                 | order                |
| createdAt         |                 | shuffleQuestions     |
| updatedAt         |                 | shuffleOptions       |
+-------------------+                 | createdAt / updatedAt|
                                      +----------+-----------+
                                                 |
                                            N : 1 (external)
                                                 |
                                      +----------v-----------+
                                      | Question Bank Set    |
                                      | (External Service)   |
                                      |----------------------|
                                      | questionSetId        |
                                      | type (MCQ / CODING)  |
                                      | questions[]          |
                                      +----------------------+
```

### DynamoDB Schema — test-config-tests

| Attribute | Type | Example |
|---|---|---|
| testId (PK) | String | a1b2c3d4-e5f6-7890-abcd-ef1234567890 |
| SK | String | METADATA |
| title | String | Full Stack Technical Assessment |
| testStatus | String | Active |
| linkId | String | 748291 |
| status | String | published |
| durationMinutes | Number | 120 |
| totalMarks | Number | 100 |
| createdAt | String | 2026-08-12T07:00:00Z |
| updatedAt | String | 2026-08-12T07:00:00Z |

### DynamoDB Schema — test-config-sections

| Attribute | Type | Example |
|---|---|---|
| sectionId (PK) | String | b2c3d4e5-f6a7-8901-bcde-f01234567890 |
| SK | String | METADATA |
| testId | String | a1b2c3d4-e5f6-7890-abcd-ef1234567890 |
| sectionName | String | Core Java MCQ Round |
| questionSetId | String | SET001 |
| questionType | String | MCQ |
| durationMinutes | Number | 30 |
| marks | Number | 40 |
| order | Number | 1 |
| shuffleQuestions | Boolean | true |
| shuffleOptions | Boolean | true |

---

## API Reference

**Base URL:** `https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com`

**Interactive Docs:** `https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com/docs`

### Health Endpoints

| Method | Path | Response |
|---|---|---|
| GET | /health | 200 {status: ok} |
| GET | / | 200 {service info} |

### Test Endpoints

| Method | Path | Description | Status Code |
|---|---|---|---|
| POST | /tests | Create test (auto generates linkId) | 201 |
| GET | /tests | List all tests | 200 |
| GET | /tests/{testId} | Get test with sections and questions | 200 |
| PUT | /tests/{testId} | Update test fields | 200 |
| DELETE | /tests/{testId} | Delete test + cascade sections | 204 |

### Section Endpoints

| Method | Path | Description | Status Code |
|---|---|---|---|
| POST | /tests/{testId}/sections | Add section (auto questionType) | 201 |
| GET | /tests/{testId}/sections | List sections | 200 |
| GET | /tests/{testId}/sections/{sectionId} | Get section | 200 |
| PUT | /tests/{testId}/sections/{sectionId} | Update section | 200 |
| DELETE | /tests/{testId}/sections/{sectionId} | Delete section | 204 |

### Question Set Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /question-sets | List all question sets |
| GET | /question-sets/{questionSetId} | Get a specific question set |

---

### Request / Response Examples

#### POST /tests — Request

```json
{
  "title": "Full Stack Technical Assessment",
  "description": "Mid-semester evaluation for backend roles",
  "status": "published",
  "durationMinutes": 120,
  "totalMarks": 100
}
```

> **Note:** Do NOT include `linkId` or `testStatus` — they are auto-generated.

#### POST /tests — Response 201

```json
{
  "testId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "linkId": "748291",
  "title": "Full Stack Technical Assessment",
  "description": "Mid-semester evaluation for backend roles",
  "status": "published",
  "testStatus": "Active",
  "durationMinutes": 120,
  "totalMarks": 100,
  "totalSections": 0,
  "totalDurationMinutes": 0,
  "createdAt": "2026-08-12T07:00:00Z",
  "updatedAt": "2026-08-12T07:00:00Z",
  "sections": []
}
```

#### POST /tests/{testId}/sections — Request

```json
{
  "sectionName": "Core Java MCQ Round",
  "questionSetId": "SET001",
  "durationMinutes": 30,
  "marks": 40,
  "order": 1,
  "shuffleQuestions": true,
  "shuffleOptions": true
}
```

> **Note:** Do NOT include `questionType` — it is auto-detected from the Question Bank.

#### GET /tests/{testId} — Full Response

```json
{
  "testId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "linkId": "748291",
  "title": "Full Stack Technical Assessment",
  "testStatus": "Active",
  "totalSections": 2,
  "totalDurationMinutes": 90,
  "totalMarks": 100,
  "sections": [
    {
      "sectionId": "sec-uuid-1",
      "sectionName": "Core Java MCQ",
      "questionType": "MCQ",
      "durationMinutes": 30,
      "marks": 40,
      "order": 1,
      "questions": [
        {
          "questionId": "Q001",
          "question": "Which keyword is used to inherit a class in Java?",
          "type": "MCQ",
          "marks": 2,
          "options": [
            {"optionId": "A", "text": "implements"},
            {"optionId": "B", "text": "extends"}
          ],
          "correctOptionId": "B"
        }
      ]
    },
    {
      "sectionId": "sec-uuid-2",
      "sectionName": "Coding Challenge",
      "questionType": "CODING",
      "durationMinutes": 60,
      "marks": 60,
      "order": 2,
      "questions": [
        {
          "questionId": "CQ001",
          "question": "Write a function to check if a string is a palindrome.",
          "marks": 20
        }
      ]
    }
  ]
}
```

---

## Error Handling

### Standard Error Format

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Code Reference

| Code | Meaning | When It Occurs |
|---|---|---|
| 200 | OK | Successful GET or PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error in request body |
| 404 | Not Found | testId or sectionId does not exist in DynamoDB |
| 422 | Unprocessable Entity | Missing required field (e.g. title) |
| 500 | Internal Server Error | Unexpected runtime error |

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| APP_NAME | Test Configuration Service | No | Service display name |
| APP_ENV | local | No | Environment tag (local/development/staging/production) |
| APP_DEBUG | false | No | Enable FastAPI debug mode |
| APP_HOST | 0.0.0.0 | No | Bind host (local dev only) |
| APP_PORT | 8000 | No | Bind port (local dev only) |
| APP_LOG_LEVEL | INFO | No | Logging level (DEBUG/INFO/WARNING/ERROR) |
| APP_CORS_ORIGINS | ["*"] | No | Allowed CORS origins list |
| AWS_REGION | ap-southeast-1 | Yes | AWS region for DynamoDB |
| DYNAMODB_TABLE_PREFIX | test-config | Yes | Prefix for DynamoDB table names |
| DYNAMODB_ENDPOINT_URL | None | No | Override endpoint (LocalStack) |
| QUESTION_SERVICE_URL | QB API URL | Yes | Base URL of the Question Bank Service |

---

## Local Development

### Prerequisites

- Python 3.13+
- pip

### Step-by-Step Setup

```bash
# Step 1: Clone the repository
git clone https://github.com/NMathanKumar/idp_test_service.git
cd test-configuration-service

# Step 2: Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux

# Step 3: Install dependencies
pip install -r requirements.txt
pip install pydantic-settings uvicorn

# Step 4: Run the service locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Local Access

| URL | Description |
|---|---|
| http://localhost:8000/docs | Interactive Swagger UI |
| http://localhost:8000/redoc | ReDoc documentation |
| http://localhost:8000/health | Health check |
| http://localhost:8000/openapi.json | Raw OpenAPI spec |

---

## Running Tests

All 23 tests run without real AWS credentials (uses in-memory fakes):

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific file
python -m pytest tests/test_test_service.py -v

# Short traceback
python -m pytest tests/ -v --tb=short
```

### Test Suite Breakdown

| Test File | Tests | What It Covers |
|---|---|---|
| test_health.py | 4 | Root endpoint, health check, 500 error handler |
| test_tests_api.py | 6 | Full /tests CRUD via FastAPI TestClient |
| test_test_service.py | 4 | UUID+linkId generation, testStatus, section question type |
| test_repositories.py | 6 | DynamoDB CRUD, duplicate conflict, not-found errors |
| test_question_sets_api.py | 3 | QB external service integration |
| **Total** | **23** | All pass in ~2 seconds |

### Test Architecture — Fake Repositories Pattern

Tests use in-memory dictionaries — no DynamoDB or network needed:

```python
class FakeTestRepository(TestRepositoryInterface[TestEntity]):
    def __init__(self):
        self.entities = {"TEST-001": TestEntity(id="TEST-001", ...)}

class FakeQuestionBankClient(QuestionBankClient):
    def get_question_set(self, qid):
        return {"type": "MCQ", "questions": [...]}  # hardcoded
```

### Expected Output

```
tests/test_health.py::test_root_endpoint PASSED
tests/test_health.py::test_health_endpoint_default_environment PASSED
tests/test_health.py::test_health_endpoint_environment_priority PASSED
tests/test_health.py::test_unexpected_error_handler_returns_500 PASSED
tests/test_question_sets_api.py::test_list_question_sets_endpoint PASSED
tests/test_question_sets_api.py::test_get_question_set_endpoint_success PASSED
tests/test_question_sets_api.py::test_get_question_set_endpoint_not_found PASSED
tests/test_repositories.py::test_create_and_get_repository_item PASSED
tests/test_repositories.py::test_list_repository_items PASSED
tests/test_repositories.py::test_update_repository_item PASSED
tests/test_repositories.py::test_delete_repository_item PASSED
tests/test_repositories.py::test_create_duplicate_repository_item_raises_conflict PASSED
tests/test_repositories.py::test_get_missing_repository_item_raises_not_found PASSED
tests/test_test_service.py::test_create_test_and_section PASSED
tests/test_test_service.py::test_get_complete_test_aggregates_sections_and_questions PASSED
tests/test_test_service.py::test_update_and_delete_test PASSED
tests/test_test_service.py::test_section_service_dynamic_question_type_extraction PASSED
tests/test_tests_api.py::test_create_test_endpoint PASSED
tests/test_tests_api.py::test_list_tests_endpoint PASSED
tests/test_tests_api.py::test_get_test_endpoint PASSED
tests/test_tests_api.py::test_get_test_endpoint_returns_404_when_missing PASSED
tests/test_tests_api.py::test_update_test_endpoint PASSED
tests/test_tests_api.py::test_delete_test_endpoint PASSED

======================= 23 passed, 5 warnings in 2.25s ========================
```

---

## Deployment

### AWS Academy Note

AWS Academy credentials expire every session (~4 hours). Get fresh credentials from the Learner Lab console (AWS Details > Show).

### Build and Deploy Lambda Package

```python
import os, shutil, zipfile, boto3, time

session = boto3.Session(
    aws_access_key_id="YOUR_KEY",
    aws_secret_access_key="YOUR_SECRET",
    aws_session_token="YOUR_SESSION_TOKEN",
    region_name="ap-southeast-1"
)

# Build package
package_dir = ".build-lambda/package"
pkg_app = os.path.join(package_dir, "app")
if os.path.exists(pkg_app):
    shutil.rmtree(pkg_app)
shutil.copytree("app", pkg_app)

with zipfile.ZipFile("lambda.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(package_dir):
        for f in files:
            fp = os.path.join(root, f)
            z.write(fp, os.path.relpath(fp, package_dir))

print(f"Package: {os.path.getsize('lambda.zip'):,} bytes")

# Upload
lc = session.client("lambda")
with open("lambda.zip", "rb") as f:
    lc.update_function_code(FunctionName="test-configuration-service", ZipFile=f.read())

# Wait for completion
for _ in range(30):
    time.sleep(2)
    info = lc.get_function(FunctionName="test-configuration-service")
    if info["Configuration"]["LastUpdateStatus"] == "Successful":
        print("Deployment successful!")
        break
```

---

## Performance Optimizations

### Summary

| Optimization | Technique | Impact |
|---|---|---|
| TTL Caching | In-memory dict with 60s expiry | QB calls: 500ms -> <1ms |
| Parallel Fetch | ThreadPoolExecutor(max_workers=5) | Multi-section: up to 70% faster |
| GZip Compression | GZipMiddleware(minimum_size=500) | Payload: up to 80% smaller |
| Fast linkId | secrets.randbelow() O(1) | No DynamoDB scan needed |

### Latency Benchmark

| Metric | Before Optimization | After Optimization |
|---|---|---|
| Average latency (GET /tests/{id}) | 928.92 ms | 565.85 ms |
| Best warm response time | 595.74 ms | 488.49 ms |

### 1. In-Memory TTL Caching

```python
# app/utils/question_bank_client.py
self._cache: dict[str, tuple[float, dict]] = {}
self.cache_ttl = 60.0  # seconds

def get_question_set(self, question_set_id: str):
    now = time.time()
    if question_set_id in self._cache:
        cached_time, cached_data = self._cache[question_set_id]
        if now - cached_time < self.cache_ttl:
            return cached_data   # served from RAM in <1ms
    data = self._fetch_remote_question_set(question_set_id)
    self._cache[question_set_id] = (now, data)
    return data
```

### 2. Parallel Section Question Fetching

```python
# app/services/test_service.py
from concurrent.futures import ThreadPoolExecutor

def _fetch_sec_questions(sec):
    return sec.id, self.question_bank_client.list_questions(sec.question_set_id)

with ThreadPoolExecutor(max_workers=min(len(sorted_sections), 5)) as executor:
    futures = [executor.submit(_fetch_sec_questions, sec) for sec in sorted_sections]
    for f in futures:
        sec_id, q_list = f.result()
        questions_map[sec_id] = q_list
```

### 3. GZip Response Compression

```python
# app/main.py
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=500)
```

### 4. Fast linkId Generation

```python
# app/services/test_service.py
import secrets

def _generate_6digit_link_id() -> str:
    return str(secrets.randbelow(900000) + 100000)
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| UUID testId (36 chars) | Globally unique, collision-proof, industry standard |
| 6-digit numeric linkId | Short and human-readable for candidate sharing |
| linkId auto-generated | No user input needed, prevents duplicates |
| testStatus = Active | Tests immediately usable after creation |
| questionType auto-detected | Comes from QB metadata, not user input |
| Fallback question sets | Resilient to QB Service downtime |
| DynamoDB PK + SK=METADATA | Supports future versioning extension |
| Fake repos in tests | Fast, credential-free test execution |
| ThreadPoolExecutor for sections | Independent sections => parallel fetch |
| 60s TTL cache | Balance freshness and performance |

---

## Contributing

### Branch Strategy

```
main         <-- Production-ready (merged from test_config)
test_config  <-- Feature development
Frontend     <-- Frontend team
QB-service   <-- Question Bank team
```

### Workflow

```bash
# 1. Branch from test_config
git checkout test_config
git checkout -b feature/my-feature

# 2. Develop and test
python -m pytest tests/ -v

# 3. Commit and push
git add .
git commit -m "feat: description of change"
git push origin feature/my-feature

# 4. Open PR to test_config
# 5. After review: merge to test_config, then to main
```

---

## Authors

- **Mathankumar Natesan** - Backend Developer, IDP Team
- **Abdul Rahman** - Platform Lead

## Repositories

| Repo | URL | Branch |
|---|---|---|
| Origin | https://github.com/NMathanKumar/idp_test_service | main, test_config |
| Platform | https://github.com/Abdul-rahman24/Hire-Platform-IDP | main, test_config, frontend, QB-service |
