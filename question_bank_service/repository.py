from botocore.exceptions import ClientError
from fastapi import HTTPException
from boto3.dynamodb.conditions import Key
from .config import table
from question_bank_service import schemas

class QuestionRepository:
    
    @staticmethod
    def create_question(question_data: schemas.QuestionCreateSchema):
        try:
            # 1. Cross-Entity Validation: Fetch parent set to check type
            parent_set = table.get_item(Key={"questionSetId": question_data.questionSetId, "questionId": "METADATA"})
            
            if "Item" not in parent_set:
                raise HTTPException(status_code=404, detail="Target Question Set does not exist.")
                
            expected_type = parent_set["Item"].get("setType")
            if expected_type and expected_type != question_data.questionType:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Type Mismatch: Set '{question_data.questionSetId}' only accepts {expected_type} questions."
                )

            # 2. Dump data dynamically (exclude_none drops 'options' if it's a Coding question)
            item_data = question_data.model_dump(exclude_none=True)
            
            # 3. Add DynamoDB Primary Keys mapping to your actual table schema
            item_data["questionSetId"] = question_data.questionSetId
            item_data["questionId"] = question_data.questionId
            item_data["itemType"] = "QUESTION"
            
            table.put_item(Item=item_data)
            return item_data
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")

    @staticmethod
    def get_questions_by_set(question_set_id: str):
        try:
            response = table.query(
                KeyConditionExpression=Key("questionSetId").eq(question_set_id)
            )
            return response.get("Items", [])
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")

    @staticmethod
    def get_single_question(question_set_id: str, question_id: str):
        try:
            response = table.get_item(Key={"questionSetId": question_set_id, "questionId": question_id})
            if "Item" not in response:
                raise HTTPException(status_code=404, detail="Question not found")
            return response["Item"]
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")

    @staticmethod
    def update_question(question_set_id: str, question_id: str, payload: schemas.QuestionUpdateSchema):
        try:
            # 1. Fetch the existing question from DynamoDB using correct schema keys
            existing_item_response = table.get_item(Key={"questionSetId": question_set_id, "questionId": question_id})

            if "Item" not in existing_item_response:
                raise HTTPException(status_code=404, detail="Question not found")

            existing_item = existing_item_response["Item"]

            # 2. 🛡️ BACKEND DEFENSE: Block attempts to change the question type!
            if existing_item.get("questionType") != payload.questionType:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Type Mismatch: You cannot change a {existing_item.get('questionType')} question into a {payload.questionType} question. Please delete and recreate it."
                )

            # 3. If it passes, prepare the updated data (exclude_none drops empty fields)
            updated_data = payload.model_dump(exclude_none=True)
            
            # 4. Merge the updated data with the required DynamoDB keys
            updated_item = {
                "questionSetId": question_set_id,
                "questionId": question_id,
                "itemType": "QUESTION",
                **updated_data
            }
            
            # 5. Overwrite the item in DynamoDB
            table.put_item(Item=updated_item)
            return updated_item
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB Error: {e.response['Error']['Message']}")