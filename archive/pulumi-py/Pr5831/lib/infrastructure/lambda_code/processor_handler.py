"""
Lambda function handler for processing HTTP requests.

This handler processes incoming HTTP POST requests, stores results in S3,
and returns structured responses with proper error handling.
"""

import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

BUCKET_NAME = os.environ.get('BUCKET_NAME', '')
PROCESSING_CONFIG = json.loads(os.environ.get('PROCESSING_CONFIG', '{}'))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process incoming HTTP POST requests and store results in S3.
    
    Args:
        event: API Gateway Lambda proxy integration event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy integration response
    """
    request_id = context.aws_request_id
    
    try:
        print(f"[INFO] Processing request: {request_id}")
        print(f"[DEBUG] Event: {json.dumps(event)}")
        
        if 'body' not in event or event['body'] is None:
            print(f"[ERROR] Missing request body for request: {request_id}")
            return create_response(400, {
                'error': 'Missing request body',
                'request_id': request_id
            })
        
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON in request body: {str(e)}")
            return create_response(400, {
                'error': 'Invalid JSON in request body',
                'request_id': request_id
            })
        
        if 'data' not in body:
            print(f"[ERROR] Missing required field 'data' for request: {request_id}")
            return create_response(400, {
                'error': 'Missing required field: data',
                'request_id': request_id
            })
        
        processed_data = process_data(body['data'], request_id)
        
        s3_key = f"processed/{datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
        
        try:
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(processed_data, default=decimal_default),
                ContentType='application/json',
                Metadata={
                    'request_id': request_id,
                    'processed_at': datetime.utcnow().isoformat(),
                    'source': 'lambda_processor'
                }
            )
            
            print(f"[INFO] Successfully stored data to s3://{BUCKET_NAME}/{s3_key}")
            
        except ClientError as e:
            print(f"[ERROR] Failed to store data in S3: {str(e)}")
            return create_response(500, {
                'error': 'Failed to store processed data',
                'request_id': request_id
            })
        
        return create_response(200, {
            'message': 'Data processed successfully',
            'request_id': request_id,
            's3_location': f"s3://{BUCKET_NAME}/{s3_key}",
            'processed_at': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"[ERROR] Unexpected error processing request {request_id}: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'request_id': request_id
        })


def process_data(data: Any, request_id: str) -> Dict[str, Any]:
    """
    Process the input data according to configuration.
    
    Args:
        data: Input data to process
        request_id: Unique request identifier
        
    Returns:
        Processed data dictionary
    """
    max_size_mb = PROCESSING_CONFIG.get('max_size_mb', 10)
    
    data_str = json.dumps(data) if not isinstance(data, str) else data
    data_size_mb = len(data_str.encode('utf-8')) / (1024 * 1024)
    
    if data_size_mb > max_size_mb:
        raise ValueError(f"Data size {data_size_mb:.2f}MB exceeds maximum {max_size_mb}MB")
    
    processed = {
        'request_id': request_id,
        'original_data': data,
        'processed_at': datetime.utcnow().isoformat(),
        'processing_config': PROCESSING_CONFIG,
        'metadata': {
            'data_type': type(data).__name__,
            'data_size_bytes': len(data_str.encode('utf-8')),
            'data_size_mb': Decimal(str(round(data_size_mb, 4)))
        }
    }
    
    return processed


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create an API Gateway Lambda proxy integration response.
    
    Args:
        status_code: HTTP status code
        body: Response body dictionary
        
    Returns:
        Properly formatted API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'X-Request-ID': body.get('request_id', 'unknown'),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Request-ID',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, default=decimal_default)
    }


def decimal_default(obj):
    """
    JSON serializer for Decimal objects.
    
    Args:
        obj: Object to serialize
        
    Returns:
        Serialized value
    """
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

