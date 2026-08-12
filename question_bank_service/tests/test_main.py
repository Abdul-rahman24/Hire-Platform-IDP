import os
import pytest
from fastapi.testclient import TestClient
from moto import mock_aws
import boto3

# 1. Set dummy AWS environment variables BEFORE importing the app
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_SECURITY_TOKEN"] = "testing"
os.environ["AWS_SESSION_TOKEN"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "ap-southeast-1"
os.environ["TABLE_NAME"] = "QuestionBankTable_SW_Test"

@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    pass

@pytest.fixture(scope="function")
def dynamodb_mock(aws_credentials):
    """Mock DynamoDB and create the required table."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="ap-southeast-1")
        
        # Create the mock table matching your schema
        table = dynamodb.create_table(
            TableName=os.environ["TABLE_NAME"],
            KeySchema=[
                {"AttributeName": "questionSetId", "KeyType": "HASH"},
                {"AttributeName": "questionId", "KeyType": "RANGE"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "questionSetId", "AttributeType": "S"},
                {"AttributeName": "questionId", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        yield dynamodb

@pytest.fixture(scope="function")
def client(dynamodb_mock):
    """Yield the FastAPI TestClient only AFTER DynamoDB is mocked."""
    # Import app here to ensure moto intercepts the boto3 calls
    from question_bank_service.main import app
    with TestClient(app) as test_client:
        yield test_client

# ==========================================
# UNIT TESTS
# ==========================================

def test_create_question_set(client):
    payload = {
        "questionSetId": "SET_TEST_01",
        "setType": "MCQ"
    }
    response = client.post("/question-sets", json=payload)
    assert response.status_code == 201
    assert response.json()["data"]["questionSetId"] == "SET_TEST_01"
    assert response.json()["data"]["setType"] == "MCQ"

def test_list_all_question_sets(client):
    # First, create a set
    client.post("/question-sets", json={"questionSetId": "SET_TEST_02", "setType": "CODING"})
    
    # Then, fetch all sets
    response = client.get("/question-sets")
    assert response.status_code == 200
    assert response.json()["totalSets"] >= 1
    assert type(response.json()["data"]) == list