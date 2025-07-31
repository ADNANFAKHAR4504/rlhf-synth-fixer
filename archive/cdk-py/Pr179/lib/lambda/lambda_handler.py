"""
Lambda function handler for processing S3 object creation events.

This Lambda function is triggered when objects are created in the S3 bucket.
It processes the event information and stores metadata in DynamoDB with
proper error handling and logging.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import unquote_plus

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ.get('TABLE_NAME')
BUCKET_NAME = os.environ.get('BUCKET_NAME')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 object creation events and store metadata in DynamoDB.
    
    Args:
        event: AWS Lambda event containing S3 event information
        context: AWS Lambda context object
        
    Returns:
        Dict containing the response status and processed record count
    """
    logger.info(f"Processing event: {json.dumps(event)}")
    
    if not TABLE_NAME:
        logger.error("TABLE_NAME environment variable is not set")
        raise ValueError("TABLE_NAME environment variable is required")
    
    processed_records = 0
    errors = []
    
    try:
        # Process each record in the S3 event
        for record in event.get('Records', []):
            try:
                processed_records += process_s3_record(record)
            except Exception as e:
                error_msg = f"Error processing record: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        # Log summary
        logger.info(f"Successfully processed {processed_records} records")
        if errors:
            logger.warning(f"Encountered {len(errors)} errors: {errors}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} records',
                'processed_count': processed_records,
                'error_count': len(errors),
                'errors': errors if errors else None
            })
        }
        
    except Exception as e:
        logger.error(f"Fatal error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Fatal error: {str(e)}',
                'processed_count': processed_records
            })
        }


def process_s3_record(record: Dict[str, Any]) -> int:
    """
    Process a single S3 record and store metadata in DynamoDB.
    
    Args:
        record: Single S3 event record
        
    Returns:
        int: 1 if processed successfully, 0 otherwise
    """
    try:
        # Extract S3 event information
        s3_info = record['s3']
        bucket_name = s3_info['bucket']['name']
        object_key = unquote_plus(s3_info['object']['key'])
        object_size = s3_info['object']['size']
        etag = s3_info['object']['eTag']
        
        # Get additional object metadata from S3
        object_metadata = get_s3_object_metadata(bucket_name, object_key)
        
        # Create DynamoDB item
        timestamp = datetime.now(timezone.utc).isoformat()
        item = {
            'pk': {'S': f'OBJECT#{object_key}'},
            'sk': {'S': f'CREATED#{timestamp}'},
            'bucket_name': {'S': bucket_name},
            'object_key': {'S': object_key},
            'object_size': {'N': str(object_size)},
            'etag': {'S': etag},
            'created_at': {'S': timestamp},
            'event_source': {'S': record['eventSource']},
            'event_name': {'S': record['eventName']},
            'event_time': {'S': record['eventTime']},
            'aws_region': {'S': record['awsRegion']}
        }
        
        # Add content type if available
        if object_metadata and 'ContentType' in object_metadata:
            item['content_type'] = {'S': object_metadata['ContentType']}
        
        # Add last modified if available
        if object_metadata and 'LastModified' in object_metadata:
            item['last_modified'] = {'S': object_metadata['LastModified'].isoformat()}
        
        # Store in DynamoDB
        store_in_dynamodb(item)
        
        logger.info(f"Successfully processed S3 object: {bucket_name}/{object_key}")
        return 1
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        raise


def get_s3_object_metadata(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """
    Get additional metadata for an S3 object.
    
    Args:
        bucket_name: Name of the S3 bucket
        object_key: Key of the S3 object
        
    Returns:
        Dict containing object metadata, or empty dict if error
    """
    try:
        response = s3.head_object(Bucket=bucket_name, Key=object_key)
        return response
    except ClientError as e:
        logger.warning(f"Could not get metadata for {bucket_name}/{object_key}: {str(e)}")
        return {}


def store_in_dynamodb(item: Dict[str, Any]) -> None:
    """
    Store an item in DynamoDB.
    
    Args:
        item: DynamoDB item to store
        
    Raises:
        Exception: If DynamoDB operation fails
    """
    try:
        response = dynamodb.put_item(
            TableName=TABLE_NAME,
            Item=item,
            # Use condition to prevent overwriting existing items
            ConditionExpression='attribute_not_exists(pk)'
        )
        logger.debug(f"DynamoDB put_item response: {response}")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Item already exists in DynamoDB: {item['pk']['S']}")
        else:
            logger.error(f"DynamoDB error: {e.response['Error']}")
            raise
    except Exception as e:
        logger.error(f"Unexpected error storing item in DynamoDB: {str(e)}")
        raise