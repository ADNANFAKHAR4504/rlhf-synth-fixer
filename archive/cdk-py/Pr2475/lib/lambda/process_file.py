import json
import boto3
import os
import logging
from datetime import datetime
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process S3 object creation events and store metadata in DynamoDB
    """
    try:
        # Get DynamoDB table name from environment variables
        table_name = os.environ['DYNAMODB_TABLE_NAME']
        table = dynamodb.Table(table_name)

        # AWS_REGION is automatically available in Lambda runtime
        # No need to pass it as environment variable
        current_region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

        logger.info(f"Processing S3 event in region: {current_region}")

        # Process each record in the event
        for record in event['Records']:
            # Extract S3 event information
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_time = record['eventTime']
            event_name = record['eventName']

            logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")

            # Get additional object metadata from S3
            try:
                response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                content_type = response.get('ContentType', 'unknown')
                last_modified = response.get('LastModified')
                if last_modified:
                    last_modified = last_modified.isoformat()
                else:
                    last_modified = datetime.now().isoformat()
                etag = response.get('ETag', '').strip('"')

            except Exception as e:
                logger.error(f"Error getting object metadata: {str(e)}")
                content_type = 'unknown'
                last_modified = datetime.now().isoformat()
                etag = 'unknown'

            # Prepare metadata for DynamoDB
            metadata_item = {
                'file_key': object_key,
                'bucket_name': bucket_name,
                'file_size': object_size,
                'content_type': content_type,
                'event_name': event_name,
                'event_time': event_time,
                'last_modified': last_modified,
                'etag': etag,
                'processed_at': datetime.now().isoformat(),
                'processing_status': 'completed',
                'region': current_region
            }

            # Store metadata in DynamoDB
            table.put_item(Item=metadata_item)

            logger.info(f"Successfully processed and stored metadata for: {object_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(event["Records"])} file(s)',
                'processed_files': [
                    unquote_plus(record['s3']['object']['key'])
                    for record in event['Records']
                ],
                'region': current_region
            })
        }

    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to process S3 event'
            })
        }
