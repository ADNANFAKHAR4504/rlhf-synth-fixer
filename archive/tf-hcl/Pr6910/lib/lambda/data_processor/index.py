import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DB_NAME = os.environ.get('DB_NAME', '')
BUCKET_PREFIX = os.environ.get('BUCKET_PREFIX', '')

def handler(event, context):
    """
    Lambda handler for processing S3 data events.

    Args:
        event: Lambda event object (S3 event notification)
        context: Lambda context object

    Returns:
        dict: Response with status and processing details
    """
    logger.info(f"Processing event in {ENVIRONMENT} environment (suffix: {ENVIRONMENT_SUFFIX})")
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Process S3 event records
        processed_files = []

        for record in event.get('Records', []):
            # Extract S3 bucket and key
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            logger.info(f"Processing file: s3://{bucket}/{key}")

            # Download file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            file_content = response['Body'].read().decode('utf-8')

            logger.info(f"File content length: {len(file_content)} bytes")

            # Process the file content
            processed_data = process_data(file_content)

            # Upload processed data back to S3
            output_key = key.replace('incoming/', 'processed/')
            s3_client.put_object(
                Bucket=bucket,
                Key=output_key,
                Body=json.dumps(processed_data),
                ContentType='application/json'
            )

            logger.info(f"Processed file uploaded to: s3://{bucket}/{output_key}")

            processed_files.append({
                'input': f"s3://{bucket}/{key}",
                'output': f"s3://{bucket}/{output_key}",
                'records': len(processed_data.get('records', []))
            })

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed files',
                'environment': ENVIRONMENT,
                'environment_suffix': ENVIRONMENT_SUFFIX,
                'processed_files': processed_files,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        logger.error(f"[ERROR] Processing failed: {str(e)}", exc_info=True)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failed to process files',
                'error': str(e),
                'environment': ENVIRONMENT,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

def process_data(content):
    """
    Process file content.

    Args:
        content: File content as string

    Returns:
        dict: Processed data
    """
    try:
        # Try to parse as JSON
        data = json.loads(content)

        # Add processing metadata
        processed = {
            'processed_at': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'environment_suffix': ENVIRONMENT_SUFFIX,
            'records': data if isinstance(data, list) else [data]
        }

        return processed

    except json.JSONDecodeError:
        # Handle non-JSON content
        lines = content.strip().split('\n')

        return {
            'processed_at': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'environment_suffix': ENVIRONMENT_SUFFIX,
            'records': [{'line': i, 'content': line} for i, line in enumerate(lines, 1)]
        }

def get_db_password():
    """
    Retrieve database password from Parameter Store.

    Returns:
        str: Database password
    """
    parameter_name = f"/{os.environ.get('PROJECT_NAME', 'payment-processing')}/{ENVIRONMENT}/{ENVIRONMENT_SUFFIX}/db/master-password"

    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True
        )
        return response['Parameter']['Value']
    except Exception as e:
        logger.error(f"Failed to retrieve DB password: {str(e)}")
        raise
