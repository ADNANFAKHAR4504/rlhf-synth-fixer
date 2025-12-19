"""
Lambda handlers for API Gateway endpoints.

This module contains handlers for the API Gateway REST API endpoints.
"""

import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def upload_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle POST /upload endpoint.
    
    Accepts CSV data and uploads it to S3 incoming/ prefix.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    print(f"Upload request: {json.dumps(event)}")
    
    try:
        # Get S3 bucket name from environment
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        if not bucket_name:
            raise ValueError("S3_BUCKET_NAME environment variable not set")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        csv_data = body.get('data')
        filename = body.get('filename', f"upload-{int(datetime.utcnow().timestamp())}.csv")
        
        if not csv_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing data field'})
            }
        
        # Upload to S3 incoming/ prefix
        key = f"incoming/{filename}"
        s3_client.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=csv_data,
            ContentType='text/csv'
        )
        
        print(f"Uploaded file to s3://{bucket_name}/{key}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'bucket': bucket_name,
                'key': key,
                'jobId': filename.replace('.csv', '')
            })
        }
        
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in upload_handler: {json.dumps(error_details)}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def status_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /status/{jobId} endpoint.
    
    Returns the processing status of a job.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    print(f"Status request: {json.dumps(event)}")
    
    try:
        # Get job ID from path parameters
        job_id = event.get('pathParameters', {}).get('jobId')
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing jobId parameter'})
            }
        
        # Get S3 bucket name from environment
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        if not bucket_name:
            raise ValueError("S3_BUCKET_NAME environment variable not set")
        
        # Check if file exists in incoming/ or processed/
        incoming_key = f"incoming/{job_id}.csv"
        processed_key = f"processed/{job_id}.csv"
        
        status = 'not_found'
        
        try:
            s3_client.head_object(Bucket=bucket_name, Key=incoming_key)
            status = 'processing'
        except ClientError:
            try:
                s3_client.head_object(Bucket=bucket_name, Key=processed_key)
                status = 'completed'
            except ClientError:
                status = 'not_found'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'jobId': job_id,
                'status': status
            })
        }
        
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in status_handler: {json.dumps(error_details)}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def results_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /results/{symbol} endpoint.
    
    Returns processed results for a symbol from DynamoDB.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    print(f"Results request: {json.dumps(event)}")
    
    try:
        # Get symbol from path parameters
        symbol = event.get('pathParameters', {}).get('symbol')
        if not symbol:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing symbol parameter'})
            }
        
        # Get DynamoDB table name from environment
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            raise ValueError("DYNAMODB_TABLE_NAME environment variable not set")
        
        table = dynamodb.Table(table_name)
        
        # Query DynamoDB for symbol
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': symbol
            },
            Limit=100,
            ScanIndexForward=False  # Most recent first
        )
        
        items = response.get('Items', [])
        
        # Convert Decimal to float for JSON serialization
        def decimal_to_float(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'symbol': symbol,
                'count': len(items),
                'results': items
            }, default=decimal_to_float)
        }
        
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in results_handler: {json.dumps(error_details)}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }

