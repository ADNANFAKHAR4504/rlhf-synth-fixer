"""
Lambda function handler for processing S3 files.

This handler processes files uploaded to S3 and sends notifications via SNS.
Uses AWS SDK retry mechanisms instead of manual retries.
"""

import json
import os
from typing import Any, Dict

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# Configure boto3 with automatic retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

s3_client = boto3.client('s3', config=boto_config)
sns_client = boto3.client('sns', config=boto_config)

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 file upload events and send notifications.
    
    Args:
        event: Lambda event containing S3 event records
        context: Lambda context object
        
    Returns:
        Response dictionary with status and results
    """
    print(f"Received event: {json.dumps(event)}")
    
    results = []
    errors = []
    
    # Process S3 events
    if 'Records' in event:
        for record in event['Records']:
            try:
                # Extract S3 information
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']
                    
                    print(f"Processing file: s3://{bucket}/{key}")
                    
                    # Get object metadata
                    response = s3_client.head_object(Bucket=bucket, Key=key)
                    file_size = response['ContentLength']
                    
                    # Process the file
                    result = process_file(bucket, key, file_size)
                    results.append(result)
                    
                    # Send success notification
                    if SNS_TOPIC_ARN:
                        send_notification(
                            'success',
                            f"Successfully processed file: {key}",
                            {
                                'bucket': bucket,
                                'key': key,
                                'size': file_size,
                                'result': result
                            }
                        )
                
            except Exception as e:
                error_msg = f"Error processing record: {str(e)}"
                print(f"ERROR: {error_msg}")
                errors.append(error_msg)
                
                # Send error notification
                if SNS_TOPIC_ARN:
                    send_notification(
                        'error',
                        error_msg,
                        {'record': record}
                    )
    
    # Process API Gateway events
    elif 'body' in event:
        try:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            result = process_api_request(body)
            results.append(result)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': 'Request processed successfully',
                    'result': result
                })
            }
        except Exception as e:
            error_msg = f"Error processing API request: {str(e)}"
            print(f"ERROR: {error_msg}")
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': error_msg
                })
            }
    
    # Return results
    response = {
        'statusCode': 200 if not errors else 500,
        'processed': len(results),
        'errors': len(errors),
        'results': results
    }
    
    if errors:
        response['error_details'] = errors
    
    return response


def process_file(bucket: str, key: str, size: int) -> Dict[str, Any]:
    """
    Process a file from S3.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        size: File size in bytes
        
    Returns:
        Processing result dictionary
    """
    print(f"Processing file: {key} ({size} bytes)")
    
    # Implement actual file processing logic here
    # For now, just return metadata
    
    return {
        'bucket': bucket,
        'key': key,
        'size': size,
        'status': 'processed'
    }


def process_api_request(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process an API Gateway request.
    
    Args:
        body: Request body
        
    Returns:
        Processing result dictionary
    """
    print(f"Processing API request: {json.dumps(body)}")
    
    # Implement actual API processing logic here
    
    return {
        'status': 'processed',
        'input': body
    }


def send_notification(status: str, message: str, details: Dict[str, Any]):
    """
    Send notification via SNS.
    
    Args:
        status: Status (success/error)
        message: Notification message
        details: Additional details dictionary
    """
    if not SNS_TOPIC_ARN:
        print("SNS_TOPIC_ARN not configured, skipping notification")
        return
    
    try:
        subject = f"File Processing {status.upper()}"
        
        notification_body = {
            'status': status,
            'message': message,
            'details': details
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=json.dumps(notification_body, indent=2)
        )
        
        print(f"Notification sent: {subject}")
        
    except ClientError as e:
        print(f"Error sending notification: {str(e)}")

