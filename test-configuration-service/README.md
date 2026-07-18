# Test Configuration Service

Production-ready backend foundation for the Smart Exam Portal's Test Configuration Service. This project uses FastAPI for the application layer, Mangum for AWS Lambda compatibility, and DynamoDB as the planned persistence layer.

## Tech Stack

- Python 3.12
- FastAPI
- AWS Lambda
- Amazon API Gateway
- Mangum
- Amazon DynamoDB
- boto3
- Pydantic v2
- uvicorn
- pytest
- python-dotenv

## Project Setup

1. Create and activate a virtual environment.
2. Install dependencies from `requirements.txt`.
3. Copy `.env.example` to `.env` and adjust values for your environment.
4. Start the local server with Uvicorn.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --app-dir test-configuration-service
```

If you run commands from inside the `test-configuration-service` directory, use:

```bash
uvicorn app.main:app --reload
```

## Running Tests

```bash
pytest
```

## Deployment Notes

- `app.main:handler` is the AWS Lambda entrypoint via Mangum.
- `template.yaml` is a starter AWS SAM placeholder for future infrastructure work.
- Environment variables should be managed per deployment environment.

## Implemented Foundation

- FastAPI app factory with OpenAPI, Swagger UI, and ReDoc enabled
- Lambda-compatible `Mangum` handler
- Centralized logging configuration
- Pydantic settings with `.env` support
- Global exception and validation error handling
- CORS middleware
- Health endpoints at `/` and `/health`
- Test Management endpoints at `/tests`
- Section Management endpoints at `/tests/{testId}/sections` and `/sections/{sectionId}`
- Mock Question Bank endpoints at `/question-sets` and `/question-sets/{id}/questions`
- Section question mapping endpoint at `/sections/{sectionId}/questions`
- Complete test template endpoint at `/tests/{testId}/complete`
- Dependency provider structure for future services and repositories
- Reusable DynamoDB resource wrapper for repository implementations
- Generic DynamoDB repository base plus concrete repositories for tests, sections, and section-question mappings

## Folder Structure

```text
test-configuration-service/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── sections.py
│   │   │   ├── tests.py
│   │   ├── __init__.py
│   │   └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   ├── handlers.py
│   │   ├── logging.py
│   │   └── __init__.py
│   ├── dependencies/
│   │   ├── providers.py
│   │   └── __init__.py
│   ├── middleware/
│   │   └── __init__.py
│   ├── models/
│   │   ├── base.py
│   │   ├── section.py
│   │   ├── section_question_mapping.py
│   │   ├── test.py
│   │   └── __init__.py
│   ├── repositories/
│   │   ├── dynamodb_base.py
│   │   ├── interfaces.py
│   │   ├── section_question_mapping_repository.py
│   │   ├── section_repository.py
│   │   ├── test_repository.py
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── health.py
│   │   ├── section.py
│   │   ├── test.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── interfaces.py
│   │   ├── section_service.py
│   │   ├── test_service.py
│   │   └── __init__.py
│   ├── utils/
│   │   ├── dynamodb.py
│   │   └── __init__.py
│   ├── __init__.py
│   └── main.py
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   ├── test_section_service.py
│   ├── test_sections_api.py
│   ├── test_test_service.py
│   ├── test_tests_api.py
│   └── test_repositories.py
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
└── template.yaml
```

## Why Each Folder Exists

- `app/api`: API routing layer. It keeps endpoint declarations separate from application bootstrap.
- `app/core`: Cross-cutting configuration such as settings, logging, exceptions, and error handlers.
- `app/models`: Future domain entities and internal business models.
- `app/models`: Persistence-friendly domain entities shared by repositories and future service logic.
- `app/schemas`: Request and response validation models for external contracts.
- `app/repositories`: Repository contracts plus generic and concrete persistence adapters.
- `app/services`: Future business use cases and orchestration logic.
- `app/middleware`: Reserved for custom HTTP middleware beyond built-in FastAPI middleware.
- `app/utils`: Shared technical helpers like the reusable DynamoDB wrapper.
- `app/dependencies`: Dependency injection providers to centralize object creation.
- `tests`: Automated tests for endpoints, services, repositories, and integration flows as the service grows.

This foundation is intentionally lean on business logic so the service stays easy to extend without reworking the architecture later.
