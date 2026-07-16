import os
import boto3
from botocore.exceptions import ProfileNotFound

DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "QuestionBankTable_SW")
AWS_REGION = "ap-southeast-1"
AWS_PROFILE = "idp-sbx-trn-lab-01"

# Initialize Boto3 Session using your specific AWS Profile
try:
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    dynamodb = session.resource("dynamodb")
except ProfileNotFound:
    # Fallback to default credentials/environment variables if running inside AWS Lambda later
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

table = dynamodb.Table(DYNAMODB_TABLE_NAME)