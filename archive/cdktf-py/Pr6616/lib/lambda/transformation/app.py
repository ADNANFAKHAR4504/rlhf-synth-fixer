"""Lambda function for transforming transaction data and storing in DynamoDB."""

import json
import os
import csv
import io
from datetime import datetime
from typing import Dict, Any
from decimal import Decimal
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

STATUS_TABLE = dynamodb.Table(os.environ['STATUS_TABLE'])
DATA_TABLE = dynamodb.Table(os.environ['DATA_TABLE'])


@xray_recorder.capture('transform_transaction')
def transform_transaction(row: Dict[str, str]) -> Dict[str, Any]:
    """Transform a transaction row into DynamoDB format."""
    timestamp = int(datetime.utcnow().timestamp())

    return {
        'transaction_id': row['transaction_id'],
        'processed_timestamp': timestamp,
        'bank_id': row['bank_id'],
        'amount': Decimal(str(row['amount'])),
        'currency': row['currency'],
        'original_timestamp': row['timestamp'],
        'processed_at': datetime.utcnow().isoformat()
    }


@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for transforming transaction data.

    Reads CSV file from S3, transforms data, and writes to DynamoDB.
    Updates processing status in status tracking table.
    """
    try:
        # Extract S3 information from event
        bucket = event.get('bucket')
        key = event.get('key')
        request_id = event.get('request_id')

        if not all([bucket, key, request_id]):
            raise ValueError("Missing required event parameters: bucket, key, or request_id")

        # Update status to processing
        timestamp = int(datetime.utcnow().timestamp())
        STATUS_TABLE.put_item(
            Item={
                'transaction_id': request_id,
                'timestamp': timestamp,
                'status': 'processing',
                'message': 'Starting data transformation'
            }
        )

        # Read CSV file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')

        # Parse and transform CSV data
        csv_file = io.StringIO(csv_content)
        reader = csv.DictReader(csv_file)

        transformed_count = 0
        for row in reader:
            transformed_data = transform_transaction(row)

            # Write transformed data to DynamoDB
            DATA_TABLE.put_item(Item=transformed_data)
            transformed_count += 1

        # Update status to completed
        STATUS_TABLE.update_item(
            Key={
                'transaction_id': request_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET #status = :status, #message = :message',
            ExpressionAttributeNames={
                '#status': 'status',
                '#message': 'message'
            },
            ExpressionAttributeValues={
                ':status': 'completed',
                ':message': f'Transformed {transformed_count} transactions'
            }
        )

        return {
            'statusCode': 200,
            'status': 'success',
            'transformed_count': transformed_count,
            'request_id': request_id
        }

    except Exception as e:
        print(f"Error transforming data: {str(e)}")

        # Update status to failed
        try:
            STATUS_TABLE.put_item(
                Item={
                    'transaction_id': request_id,
                    'timestamp': int(datetime.utcnow().timestamp()),
                    'status': 'failed',
                    'message': f'Transformation error: {str(e)}'
                }
            )
        except Exception as status_error:
            print(f"Failed to update status: {str(status_error)}")

        raise
