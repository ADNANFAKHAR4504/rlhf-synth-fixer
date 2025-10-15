"""
API Handler Lambda function.

This function handles API Gateway requests and processes them.
"""

import json
import os
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API Gateway requests.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        # Get environment variables
        table_name = os.getenv('DYNAMODB_TABLE_NAME')
        audit_table_name = os.getenv('DYNAMODB_AUDIT_TABLE_NAME')
        s3_bucket = os.getenv('S3_BUCKET_NAME')
        
        # Initialize AWS clients
        dynamodb = boto3.client('dynamodb')
        s3 = boto3.client('s3')
        
        # Process the request
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        if http_method == 'GET':
            # Handle GET request
            response_data = {
                'message': 'Hello from API Handler',
                'method': http_method,
                'path': path,
                'timestamp': context.aws_request_id
            }
        elif http_method == 'POST':
            # Handle POST request
            body = json.loads(event.get('body', '{}'))
            response_data = {
                'message': 'Data received',
                'method': http_method,
                'path': path,
                'data': body,
                'timestamp': context.aws_request_id
            }
        else:
            response_data = {
                'message': 'Method not supported',
                'method': http_method,
                'path': path
            }
        
        # Log to audit table
        try:
            dynamodb.put_item(
                TableName=audit_table_name,
                Item={
                    'timestamp': {'S': context.aws_request_id},
                    'event_type': {'S': 'api_request'},
                    'method': {'S': http_method},
                    'path': {'S': path}
                }
            )
        except Exception as e:
            print(f"Failed to log to audit table: {e}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Error in API handler: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
