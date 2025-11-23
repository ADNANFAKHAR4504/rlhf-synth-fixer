"""
File Processor Lambda function.

Processes files uploaded to S3 and stores metadata in DynamoDB.
"""

import json
import os
import time
from decimal import Decimal
from typing import Any, Dict
from urllib.parse import unquote_plus

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
s3_client = boto3.client('s3', config=boto_config)
dynamodb = boto3.resource('dynamodb', config=boto_config)
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for S3 events.
    
    Processes file uploads and stores metadata in DynamoDB.
    
    Args:
        event: S3 event
        context: Lambda context
        
    Returns:
        Processing result
    """
    print(f"Received event: {json.dumps(event)}")
    
    processed = 0
    errors = 0
    results = []
    
    # Process each S3 record
    for record in event.get('Records', []):
        try:
            # Extract S3 information
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])
            size = record['s3']['object']['size']
            
            print(f"Processing file: s3://{bucket}/{key} ({size} bytes)")
            
            # Get file metadata
            metadata = s3_client.head_object(Bucket=bucket, Key=key)
            
            # Store in DynamoDB
            item_id = f"file-{key.replace('/', '-')}"
            timestamp = Decimal(str(time.time()))
            
            item = {
                'item_id': item_id,
                'timestamp': timestamp,
                'status': 'processed',
                'data': {
                    'bucket': bucket,
                    'key': key,
                    'size': size,
                    'content_type': metadata.get('ContentType', 'unknown'),
                    'etag': metadata.get('ETag', ''),
                },
                'created_at': timestamp
            }
            
            table.put_item(Item=item)
            print(f"Stored metadata for: {key}")
            
            # Send success notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="File Processed",
                    Message=f"Successfully processed file: {key} ({size} bytes)"
                )
            except Exception as e:
                print(f"Error sending SNS notification: {str(e)}")
            
            processed += 1
            results.append({
                'key': key,
                'status': 'success'
            })
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            errors += 1
            results.append({
                'key': record.get('s3', {}).get('object', {}).get('key', 'unknown'),
                'status': 'error',
                'error': str(e)
            })
            
            # Send error notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="File Processing Error",
                    Message=f"Error processing file: {str(e)}"
                )
            except Exception as sns_error:
                print(f"Error sending SNS notification: {str(sns_error)}")
    
    return {
        'statusCode': 200 if errors == 0 else 500,
        'processed': processed,
        'errors': errors,
        'results': results
    }

