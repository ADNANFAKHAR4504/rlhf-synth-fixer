import json
import boto3
import logging
import os
from datetime import datetime
from urllib.parse import unquote_plus
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
BUCKET_NAME = os.environ['S3_BUCKET_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda function to process S3 object creation events.
    
    This function is triggered when objects are created in the S3 bucket.
    It extracts metadata from the S3 event and stores it in DynamoDB.
    
    Args:
        event: S3 event notification
        context: Lambda context object
        
    Returns:
        Dict containing status and processed records count
    """
    
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        processed_records = 0
        
        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                processed_records += process_s3_record(record, table)
        
        logger.info(f"Successfully processed {processed_records} records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} records',
                'environment': ENVIRONMENT
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise


def process_s3_record(record: Dict[str, Any], table) -> int:
    """
    Process a single S3 record and store metadata in DynamoDB.
    
    Args:
        record: Single S3 event record
        table: DynamoDB table resource
        
    Returns:
        Number of records processed (0 or 1)
    """
    
    try:
        # Extract S3 information
        s3_info = record['s3']
        bucket_name = s3_info['bucket']['name']
        object_key = unquote_plus(s3_info['object']['key'])
        object_size = s3_info['object']['size']
        
        # Extract event information
        event_name = record['eventName']
        event_time = record['eventTime']
        
        logger.info(f"Processing object: {object_key} from bucket: {bucket_name}")
        
        # Get additional object metadata from S3
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            content_type = response.get('ContentType', 'unknown')
            last_modified = response.get('LastModified', datetime.now()).isoformat()
            etag = response.get('ETag', '').strip('"')
        except Exception as e:
            logger.warning(f"Could not get object metadata: {str(e)}")
            content_type = 'unknown'
            last_modified = datetime.now().isoformat()
            etag = 'unknown'
        
        # Create DynamoDB item
        item = {
            'pk': f"OBJECT#{bucket_name}",  # Partition key
            'sk': f"KEY#{object_key}#{event_time}",  # Sort key with timestamp for uniqueness
            'object_key': object_key,
            'bucket_name': bucket_name,
            'object_size': object_size,
            'content_type': content_type,
            'event_name': event_name,
            'event_time': event_time,
            'last_modified': last_modified,
            'etag': etag,
            'processed_at': datetime.now().isoformat(),
            'environment': ENVIRONMENT,
            'lambda_request_id': getattr(context, 'aws_request_id', 'unknown') if 'context' in locals() else 'unknown'
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored metadata for {object_key}")
        return 1
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        # Re-raise to trigger Lambda retry mechanism
        raise


def get_object_metadata(bucket: str, key: str) -> Dict[str, Any]:
    """
    Get additional metadata for an S3 object.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        Dictionary containing object metadata
    """
    
    try:
        response = s3_client.head_object(Bucket=bucket, Key=key)
        return {
            'content_type': response.get('ContentType', 'unknown'),
            'content_length': response.get('ContentLength', 0),
            'last_modified': response.get('LastModified', datetime.now()).isoformat(),
            'etag': response.get('ETag', '').strip('"'),
            'server_side_encryption': response.get('ServerSideEncryption', 'none'),
            'metadata': response.get('Metadata', {})
        }
    except Exception as e:
        logger.warning(f"Could not retrieve metadata for {key}: {str(e)}")
        return {
            'content_type': 'unknown',
            'content_length': 0,
            'last_modified': datetime.now().isoformat(),
            'etag': 'unknown',
            'server_side_encryption': 'unknown',
            'metadata': {}
        }
