"""
Lambda function for validating financial transaction files.

This function validates incoming CSV and JSON files against required schema,
updates processing status in DynamoDB, and raises exceptions for invalid files.
"""

import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Validate incoming transaction files.

    Args:
        event: Event from EventBridge containing S3 bucket and key
        context: Lambda context

    Returns:
        dict: Status with file_id, bucket, key, and validation result

    Raises:
        ValueError: If file format is invalid or missing required fields
    """

    # Extract file information from event
    bucket = event['bucket']['name']
    key = event['object']['key']
    file_id = key.split('/')[-1]

    table_name = os.environ['TABLE_NAME']
    table = dynamodb.Table(table_name)

    # Update status to validating
    table.put_item(
        Item={
            'file_id': file_id,
            'status': 'VALIDATING',
            'timestamp': datetime.utcnow().isoformat(),
            'bucket': bucket,
            'key': key
        }
    )

    try:
        # Download file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')

        # Validate based on file extension
        if key.endswith('.csv'):
            validate_csv(content)
        elif key.endswith('.json'):
            validate_json(content)
        else:
            raise ValueError(f"Unsupported file format: {key}")

        # Update status to validated
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, validated_at = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'VALIDATED',
                ':timestamp': datetime.utcnow().isoformat()
            }
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'bucket': bucket,
            'key': key,
            'validation': 'passed'
        }

    except Exception as e:
        # Update status to validation failed
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, error = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'VALIDATION_FAILED',
                ':error': str(e)
            }
        )
        raise


def validate_csv(content):
    """
    Validate CSV file format and required fields.

    Args:
        content: CSV file content as string

    Raises:
        ValueError: If CSV is malformed or missing required fields
    """
    lines = content.split('\n')
    if len(lines) < 2:
        raise ValueError("CSV file must have header and at least one data row")

    header = lines[0].split(',')
    required_fields = ['transaction_id', 'amount', 'date', 'account_id']

    for field in required_fields:
        if field not in header:
            raise ValueError(f"Missing required field: {field}")


def validate_json(content):
    """
    Validate JSON file format and required fields.

    Args:
        content: JSON file content as string

    Raises:
        ValueError: If JSON is malformed or missing required fields
    """
    data = json.loads(content)

    if not isinstance(data, list):
        raise ValueError("JSON file must contain an array of transactions")

    if len(data) == 0:
        raise ValueError("JSON file must contain at least one transaction")

    required_fields = ['transaction_id', 'amount', 'date', 'account_id']
    for transaction in data:
        for field in required_fields:
            if field not in transaction:
                raise ValueError(f"Transaction missing required field: {field}")
