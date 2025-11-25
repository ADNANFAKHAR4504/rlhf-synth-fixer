import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
REGION = os.environ['REGION']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """
    Lambda function to process S3 events and perform ETL operations.

    This function:
    1. Receives S3 event notifications
    2. Reads the uploaded object
    3. Processes/transforms the data
    4. Writes processed data back to S3
    5. Records job metadata in DynamoDB
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Extract S3 event details
        if 'Records' in event:
            for record in event['Records']:
                # Handle S3 event
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']

                    # Skip processed files
                    if key.startswith('processed/'):
                        print(f"Skipping already processed file: {key}")
                        continue

                    # Process the file
                    process_s3_file(bucket, key)

        return {
            'statusCode': 200,
            'body': json.dumps('Processing completed successfully')
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        # Log error to DynamoDB
        log_error_to_dynamodb(event, str(e))
        raise


def process_s3_file(bucket, key):
    """Process a single S3 file"""
    job_id = f"{key}-{int(datetime.now().timestamp())}"

    try:
        print(f"Processing file: s3://{bucket}/{key}")

        # Record job start in DynamoDB
        record_job_status(job_id, 'STARTED', key)

        # Read the file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        raw_data = response['Body'].read().decode('utf-8')

        # Perform ETL transformation
        processed_data = transform_data(raw_data)

        # Write processed data back to S3
        output_key = f"processed/{key}"
        s3.put_object(
            Bucket=bucket,
            Key=output_key,
            Body=processed_data.encode('utf-8'),
            ServerSideEncryption='AES256'
        )

        print(f"Processed file written to: s3://{bucket}/{output_key}")

        # Record job completion in DynamoDB
        record_job_status(job_id, 'COMPLETED', key, output_key)

    except Exception as e:
        print(f"Error processing file {key}: {str(e)}")
        # Record job failure in DynamoDB
        record_job_status(job_id, 'FAILED', key, error=str(e))
        raise


def transform_data(raw_data):
    """
    Transform/process the raw data.
    This is a placeholder - implement actual ETL logic here.
    """
    # Example transformation: convert to uppercase and add timestamp
    timestamp = datetime.now().isoformat()
    processed = f"Processed at {timestamp}\n"
    processed += f"Region: {REGION}\n"
    processed += f"Environment: {ENVIRONMENT_SUFFIX}\n"
    processed += f"Original Data:\n{raw_data.upper()}"

    return processed


def record_job_status(job_id, status, input_path, output_path=None, error=None):
    """Record job metadata in DynamoDB"""
    try:
        item = {
            'job_id': job_id,
            'timestamp': Decimal(str(datetime.now().timestamp())),
            'status': status,
            'input_path': input_path,
            'region': REGION,
            'environment_suffix': ENVIRONMENT_SUFFIX
        }

        if output_path:
            item['output_path'] = output_path

        if error:
            item['error'] = error

        table.put_item(Item=item)
        print(f"Recorded job status: {job_id} - {status}")

    except Exception as e:
        print(f"Error recording job status: {str(e)}")
        # Don't raise - job processing is more important than metadata


def log_error_to_dynamodb(event, error):
    """Log error details to DynamoDB"""
    try:
        job_id = f"error-{int(datetime.now().timestamp())}"
        table.put_item(Item={
            'job_id': job_id,
            'timestamp': Decimal(str(datetime.now().timestamp())),
            'status': 'ERROR',
            'error': error,
            'event': json.dumps(event),
            'region': REGION,
            'environment_suffix': ENVIRONMENT_SUFFIX
        })
    except Exception as e:
        print(f"Failed to log error to DynamoDB: {str(e)}")
