import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict

import boto3

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler for processing API Gateway requests."""
    try:
        # Parse the HTTP method and path
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        path = event.get('pathParameters', {}).get('proxy', 'home')
        request_id = event.get('requestContext', {}).get('requestId', 'unknown')
        source_ip = event.get('requestContext', {}).get('http', {}).get('sourceIp', 'unknown')
        
        # Generate timestamp
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Log visit details
        logger.info(f"Recording visit: path=/{path}, ip={source_ip}, method={http_method}")
        
        # Store visit in DynamoDB
        item = {
            'id': request_id,
            'timestamp': timestamp,
            'ip': source_ip,
            'path': f"/{path}",
            'method': http_method
        }
        
        table.put_item(Item=item)
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({
                'message': 'Visit logged successfully',
                'path': f"/{path}",
                'timestamp': timestamp
            })
        }
        
    except Exception as e:
        logger.error(f"Error recording visit: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            })
        }
