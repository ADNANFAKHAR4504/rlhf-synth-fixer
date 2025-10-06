import json
import boto3
import uuid
import os
import datetime
import logging

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """
    Lambda function handler for survey submission
    Validates input, generates unique ID and timestamp, stores in DynamoDB
    """
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        if 'surveyId' not in body or 'responses' not in body:
            logger.warning("Missing required fields in request")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields: surveyId and responses are required'})
            }
        
        # Validate data types
        if not isinstance(body['responses'], dict):
            logger.warning("Invalid responses format - must be an object")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Responses must be an object/dictionary'})
            }
        
        # Generate unique ID and timestamp
        response_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()
        
        # Create item for DynamoDB
        item = {
            'responseId': response_id,
            'surveyId': body['surveyId'],
            'timestamp': timestamp,
            'responses': body['responses']
        }
        
        # Add optional fields if present
        if 'respondentId' in body:
            item['respondentId'] = body['respondentId']
        
        # Add metadata
        item['createdAt'] = timestamp
        item['source'] = 'api'
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored response with ID: {response_id}")
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'responseId': response_id,
                'message': 'Survey response submitted successfully',
                'timestamp': timestamp
            })
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON format in request body'})
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }