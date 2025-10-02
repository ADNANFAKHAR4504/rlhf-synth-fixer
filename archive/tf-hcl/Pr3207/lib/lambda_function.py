import json
import boto3
import os
import logging

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
secretsmanager = boto3.client('secretsmanager')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
LOG_BUCKET = os.environ.get('LOG_BUCKET')
API_KEY_SECRET = os.environ.get('API_KEY_SECRET')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    # Example: API key retrieval
    try:
        secret_response = secretsmanager.get_secret_value(SecretId=API_KEY_SECRET)
        api_keys = json.loads(secret_response['SecretString'])
    except Exception as e:
        logger.error(f"Failed to retrieve API keys: {e}")
        return {"statusCode": 500, "body": "Internal server error"}

    # Example: DynamoDB put item
    table = dynamodb.Table(TABLE_NAME)
    item = {
        'id': event.get('requestContext', {}).get('requestId', 'unknown'),
        'payload': event.get('body', '{}')
    }
    try:
        table.put_item(Item=item)
    except Exception as e:
        logger.error(f"DynamoDB error: {e}")
        return {"statusCode": 500, "body": "Database error"}

    # Example: S3 log
    try:
        log_data = json.dumps({"event": event, "context": str(context)})
        s3.put_object(Bucket=LOG_BUCKET, Key=f"logs/{item['id']}.json", Body=log_data)
    except Exception as e:
        logger.warning(f"S3 log error: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Request processed", "item": item})
    }
