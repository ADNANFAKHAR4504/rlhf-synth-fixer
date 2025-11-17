"""
API Handler Lambda function.

This function handles API Gateway requests, processes data,
stores it in DynamoDB and S3 with structured JSON logging.
"""

import json
import logging
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    request_id = context.aws_request_id
    
    logger.info(json.dumps({
        'message': 'Processing request',
        'request_id': request_id,
        'event': event
    }))
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        symbol = body.get('symbol')
        data = body.get('data')
        
        if not symbol or not data:
            logger.error(json.dumps({
                'message': 'Missing required fields',
                'request_id': request_id,
                'body': body
            }))
            return create_response(400, {
                'error': 'Missing required fields: symbol and data',
                'request_id': request_id
            })
        
        timestamp = Decimal(str(datetime.utcnow().timestamp()))
        
        item = {
            'symbol': symbol,
            'timestamp': timestamp,
            'data': data,
            'request_id': request_id,
            'processed_at': datetime.utcnow().isoformat()
        }
        
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(Item=item)
        
        logger.info(json.dumps({
            'message': 'Item stored in DynamoDB',
            'request_id': request_id,
            'symbol': symbol,
            'timestamp': float(timestamp)
        }))
        
        s3_key = f'processed/{symbol}/{request_id}.json'
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(item, default=decimal_default),
            ContentType='application/json'
        )
        
        logger.info(json.dumps({
            'message': 'Data stored in S3',
            'request_id': request_id,
            's3_key': s3_key
        }))
        
        return create_response(200, {
            'message': 'Data processed successfully',
            'request_id': request_id,
            'symbol': symbol,
            'timestamp': float(timestamp)
        })
        
    except Exception as e:
        logger.error(json.dumps({
            'message': 'Error processing request',
            'request_id': request_id,
            'error': str(e)
        }), exc_info=True)
        
        return create_response(500, {
            'error': 'Internal server error',
            'request_id': request_id
        })


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create API Gateway response with CORS headers.
    
    Args:
        status_code: HTTP status code
        body: Response body
        
    Returns:
        API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'X-Request-ID': body.get('request_id', '')
        },
        'body': json.dumps(body)
    }

