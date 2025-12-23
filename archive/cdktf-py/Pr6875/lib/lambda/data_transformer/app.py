"""Data transformation Lambda function."""

import json
import os
import csv
import io
import boto3
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

S3_BUCKET = os.environ['S3_BUCKET']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
STATUS_TABLE = os.environ['STATUS_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']


def update_status_table(file_id: str, status: str, message: str = ""):
    """Update processing status in DynamoDB."""
    table = dynamodb.Table(STATUS_TABLE)
    timestamp = int(datetime.utcnow().timestamp())

    table.put_item(
        Item={
            'file_id': file_id,
            'status': status,
            'timestamp': timestamp,
            'message': message,
            'updated_at': datetime.utcnow().isoformat()
        }
    )


def transform_and_store_data(file_id: str, csv_content: str) -> int:
    """
    Transform CSV data and store in DynamoDB.

    Returns:
        int: Number of records processed
    """
    transactions_table = dynamodb.Table(TRANSACTIONS_TABLE)
    csv_reader = csv.DictReader(io.StringIO(csv_content))

    records_processed = 0

    # Process in batches for better performance
    with transactions_table.batch_writer() as batch:
        for row in csv_reader:
            # Transform data
            item = {
                'transaction_id': row['transaction_id'],
                'amount': Decimal(str(row['amount'])),
                'currency': row['currency'],
                'timestamp': int(datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00')).timestamp()),
                'merchant': row['merchant'],
                'status': row['status'],
                'file_id': file_id,
                'processed_at': datetime.utcnow().isoformat()
            }

            # Write to DynamoDB
            batch.put_item(Item=item)
            records_processed += 1

    return records_processed


def handler(event, context):
    """
    Lambda handler for data transformation.

    Handles S3 events and Step Functions invocations.
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Handle S3 event
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']

                    # Extract file_id from key
                    file_id = key.split('/')[-1].replace('.csv', '')

                    # Update status: processing
                    update_status_table(file_id, 'processing')

                    # Fetch CSV from S3
                    response = s3_client.get_object(Bucket=bucket, Key=key)
                    csv_content = response['Body'].read().decode('utf-8')

                    # Transform and store data
                    records_processed = transform_and_store_data(file_id, csv_content)

                    # Update status: processed
                    update_status_table(
                        file_id,
                        'processed',
                        f"Successfully processed {records_processed} records"
                    )

                    return {
                        'statusCode': 200,
                        'file_id': file_id,
                        'records_processed': records_processed,
                        'status': 'processed'
                    }

        # Handle Step Functions invocation
        elif 'file_id' in event or 's3_key' in event:
            file_id = event.get('file_id', 'unknown')
            s3_key = event.get('s3_key')
            bucket = event.get('bucket', S3_BUCKET)

            # Update status: processing
            update_status_table(file_id, 'processing')

            # Fetch CSV from S3
            response = s3_client.get_object(Bucket=bucket, Key=s3_key)
            csv_content = response['Body'].read().decode('utf-8')

            # Transform and store data
            records_processed = transform_and_store_data(file_id, csv_content)

            # Update status: processed
            update_status_table(
                file_id,
                'processed',
                f"Successfully processed {records_processed} records"
            )

            return {
                'statusCode': 200,
                'file_id': file_id,
                'records_processed': records_processed,
                'status': 'processed'
            }
        else:
            raise ValueError("Invalid event format")

    except Exception as e:
        print(f"Error: {str(e)}")

        if 'file_id' in event:
            update_status_table(event['file_id'], 'processing_failed', str(e))

        raise e
