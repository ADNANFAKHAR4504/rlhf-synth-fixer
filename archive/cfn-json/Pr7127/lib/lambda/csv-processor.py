import json
import boto3
import os
import csv
import io
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Process CSV files uploaded to S3 and store metadata in DynamoDB.

    This function is triggered by S3 ObjectCreated events for CSV files.
    It downloads the file, parses the CSV content, extracts metadata,
    and stores processing results in DynamoDB for analytics dashboards.

    Args:
        event: S3 event notification
        context: Lambda context object

    Returns:
        dict: Response with status code and processing results
    """
    try:
        # Extract bucket and key from S3 event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']

        print(f'Processing file: s3://{bucket}/{key}')

        # Download CSV file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        file_size = response['ContentLength']

        # Parse CSV and count rows
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(csv_reader)
        row_count = len(rows)

        # Extract column names for metadata
        column_names = list(rows[0].keys()) if rows else []

        print(f'File contains {row_count} rows and {len(column_names)} columns')

        # Get DynamoDB table from environment
        table_name = os.environ['DYNAMODB_TABLE']
        table = dynamodb.Table(table_name)

        # Prepare metadata record
        current_time = datetime.utcnow().isoformat()
        metadata = {
            'file_id': key,
            'bucket': bucket,
            'file_name': os.path.basename(key),
            'file_size': file_size,
            'row_count': row_count,
            'column_count': len(column_names),
            'column_names': column_names,
            'upload_timestamp': current_time,
            'processing_status': 'completed',
            'processed_timestamp': current_time,
            'environment': os.environ.get('ENVIRONMENT_TYPE', 'unknown')
        }

        # Store metadata in DynamoDB
        table.put_item(Item=metadata)

        print(f'Successfully processed {row_count} rows from {key}')
        print(f'Metadata stored in DynamoDB table: {table_name}')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'CSV processed successfully',
                'file': key,
                'row_count': row_count,
                'column_count': len(column_names),
                'file_size': file_size
            })
        }

    except Exception as e:
        error_message = f'Error processing CSV: {str(e)}'
        print(error_message)

        # Attempt to store error status in DynamoDB
        try:
            table_name = os.environ['DYNAMODB_TABLE']
            table = dynamodb.Table(table_name)

            error_metadata = {
                'file_id': key,
                'bucket': bucket,
                'file_name': os.path.basename(key),
                'upload_timestamp': datetime.utcnow().isoformat(),
                'processing_status': 'failed',
                'error_message': str(e),
                'environment': os.environ.get('ENVIRONMENT_TYPE', 'unknown')
            }

            table.put_item(Item=error_metadata)
            print(f'Error metadata stored in DynamoDB')

        except Exception as db_error:
            print(f'Failed to store error metadata in DynamoDB: {str(db_error)}')

        # Re-raise exception for Lambda error handling
        raise e
