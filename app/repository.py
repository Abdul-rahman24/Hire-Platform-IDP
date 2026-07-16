from botocore.exceptions import ClientError

from fastapi import HTTPException
from boto3.dynamodb.conditions import Key
from app.config import table
from app import schemas

class QuestionRepository:
    
    @staticmethod
    def create_question(question_data: schemas.QuestionCreateSchema):
        try:
            # DynamoDB requires dict mapping for options list
            options_dict = [opt.model_dump() for opt in question_data.options]
            
            item = {
                "PK": question_data.questionSetId, # Partition Key
                "SK": question_data.questionId,    # Sort Key
                "questionSetId": question_data.questionSetId,
                "questionId": question_data.questionId,
                "question": question_data.question,
                "options": options_dict
            }
            table.put_item(Item=item)
            return item
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")

    @staticmethod
    def get_questions_by_set(question_set_id: str):
        try:
            # Querying DynamoDB using the Partition Key fetches the whole set instantly
            response = table.query(
                KeyConditionExpression=Key("PK").eq(question_set_id)
            )
            items = response.get("Items", [])
            return items
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")

    @staticmethod
    def get_single_question(question_set_id: str, question_id: str):
        try:
            response = table.get_item(Key={"PK": question_set_id, "SK": question_id})
            if "Item" not in response:
                raise HTTPException(status_code=404, detail="Question not found")
            return response["Item"]
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")