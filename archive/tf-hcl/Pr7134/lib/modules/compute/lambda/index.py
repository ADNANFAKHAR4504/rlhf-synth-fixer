import json
import os
import boto3
import logging
from datetime import datetime

# Initialize logger
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(log_level)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda function handler for processing requests
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Get environment information
        environment = os.environ.get('ENVIRONMENT', 'unknown')

        # Extract request information
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')

        if http_method == 'GET':
            # Handle GET request - retrieve data
            response = handle_get_request(event)
        elif http_method == 'POST':
            # Handle POST request - store data
            response = handle_post_request(event)
        else:
            response = {
                'statusCode': 405,
                'body': json.dumps({
                    'error': 'Method not allowed'
                })
            }

        logger.info(f"Response: {json.dumps(response)}")
        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_get_request(event):
    """
    Handle GET request - retrieve items from DynamoDB
    """
    try:
        # Scan table for items
        response = table.scan(Limit=10)
        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'count': len(items),
                'items': items,
                'environment': os.environ.get('ENVIRONMENT')
            })
        }
    except Exception as e:
        logger.error(f"Error retrieving items: {str(e)}")
        raise

def handle_post_request(event):
    """
    Handle POST request - store item in DynamoDB
    """
    try:
        # Parse request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)

        # Generate item ID and timestamp
        item_id = f"{datetime.utcnow().timestamp()}"
        timestamp = int(datetime.utcnow().timestamp())

        # Create item
        item = {
            'id': item_id,
            'timestamp': timestamp,
            'data': body,
            'environment': os.environ.get('ENVIRONMENT')
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Item created successfully',
                'item_id': item_id,
                'environment': os.environ.get('ENVIRONMENT')
            })
        }
    except Exception as e:
        logger.error(f"Error storing item: {str(e)}")
        raise
