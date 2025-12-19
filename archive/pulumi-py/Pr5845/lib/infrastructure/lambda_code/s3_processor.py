"""
S3 Event Processor Lambda function.

This function handles S3 event notifications, processes uploaded files,
and stores results in DynamoDB with structured JSON logging.
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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for S3 event notifications.
    
    Args:
        event: S3 event
        context: Lambda context
        
    Returns:
        Processing result
    """
    request_id = context.aws_request_id
    
    logger.info(json.dumps({
        'message': 'Processing S3 event',
        'request_id': request_id,
        'event': event
    }))
    
    try:
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(json.dumps({
                'message': 'Processing S3 object',
                'request_id': request_id,
                'bucket': bucket,
                'key': key
            }))
            
            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read().decode('utf-8')
            data = json.loads(content)
            
            symbol = data.get('symbol', 'unknown')
            timestamp = Decimal(str(datetime.utcnow().timestamp()))
            
            item = {
                'symbol': symbol,
                'timestamp': timestamp,
                's3_bucket': bucket,
                's3_key': key,
                'data': data,
                'request_id': request_id,
                'processed_at': datetime.utcnow().isoformat()
            }
            
            table = dynamodb.Table(TABLE_NAME)
            table.put_item(Item=item)
            
            logger.info(json.dumps({
                'message': 'S3 object processed and stored in DynamoDB',
                'request_id': request_id,
                'symbol': symbol,
                'timestamp': float(timestamp)
            }))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 events processed successfully',
                'request_id': request_id
            })
        }
        
    except Exception as e:
        logger.error(json.dumps({
            'message': 'Error processing S3 event',
            'request_id': request_id,
            'error': str(e)
        }), exc_info=True)
        
        raise

