"""
Lambda handler for file processing.

This handler processes file uploads, stores metadata in DynamoDB,
and publishes notifications to SNS.
"""

import base64
import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
METADATA_TABLE = os.environ.get('METADATA_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')


def handler(event, context):
    """
    Process file upload requests from API Gateway.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    print(f"[INFO] Processing file upload request. Request ID: {context.aws_request_id}")
    
    try:
        if not event.get('body'):
            return create_response(400, {'error': 'Missing request body'})
        
        body = json.loads(event['body'])
        
        if 'file_content' not in body:
            return create_response(400, {'error': 'Missing file_content in request'})
        
        file_content = base64.b64decode(body['file_content'])
        file_name = body.get('file_name', f"upload-{uuid.uuid4()}")
        content_type = body.get('content_type', 'application/octet-stream')
        
        file_id = str(uuid.uuid4())
        
        s3_key = f"{file_id}/{file_name}"
        print(f"[INFO] Uploading file to S3: {BUCKET_NAME}/{s3_key}")
        
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='aws:kms'
        )
        
        file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        
        table = dynamodb.Table(METADATA_TABLE)
        metadata = {
            'file_id': file_id,
            'file_name': file_name,
            'content_type': content_type,
            's3_key': s3_key,
            'file_url': file_url,
            'file_size': Decimal(str(len(file_content))),
            'upload_time': datetime.now().isoformat(),
            'request_id': context.aws_request_id
        }
        
        print(f"[INFO] Storing metadata in DynamoDB: {file_id}")
        table.put_item(Item=metadata)
        
        if SNS_TOPIC_ARN:
            print(f"[INFO] Publishing notification to SNS")
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"New file uploaded: {file_name}",
                Message=json.dumps({
                    'event': 'file_uploaded',
                    'file_id': file_id,
                    'file_name': file_name,
                    'file_url': file_url,
                    'upload_time': metadata['upload_time']
                })
            )
        
        print(f"[INFO] File processed successfully: {file_id}")
        return create_response(200, {
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'file_url': file_url,
            'metadata': {
                'file_id': file_id,
                'file_name': file_name,
                'content_type': content_type,
                's3_key': s3_key,
                'file_size': int(metadata['file_size']),
                'upload_time': metadata['upload_time']
            }
        })
        
    except ClientError as e:
        print(f"[ERROR] AWS service error: {str(e)}")
        return create_response(500, {'error': f'AWS service error: {str(e)}'})
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return create_response(500, {'error': f'Error processing file: {str(e)}'})


def create_response(status_code, body):
    """
    Create an API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body (will be JSON-encoded)
        
    Returns:
        API Gateway response dict
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

