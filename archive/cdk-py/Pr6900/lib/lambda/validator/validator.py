import json
import boto3
import os
import csv
from io import StringIO
from typing import Dict, List, Any

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

STATUS_TABLE = os.environ['STATUS_TABLE']
BUCKET_NAME = os.environ['BUCKET_NAME']

# Expected CSV headers and data types
EXPECTED_HEADERS = [
    'transaction_id',
    'account_id',
    'transaction_date',
    'amount',
    'currency',
    'merchant',
    'category'
]

EXPECTED_TYPES = {
    'transaction_id': str,
    'account_id': str,
    'transaction_date': str,
    'amount': float,
    'currency': str,
    'merchant': str,
    'category': str,
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Validate CSV file headers and data types.

    Args:
        event: Event data from previous step
        context: Lambda context

    Returns:
        Validation result with file_id and chunks
    """
    try:
        file_id = event['file_id']
        bucket = event['bucket']
        key = event['key']

        # Read first chunk to validate headers
        response = s3_client.get_object(
            Bucket=bucket,
            Key=key,
            Range='bytes=0-4096'
        )

        sample_data = response['Body'].read().decode('utf-8')
        csv_reader = csv.DictReader(StringIO(sample_data))

        # Validate headers
        headers = csv_reader.fieldnames
        if not headers:
            raise ValueError("CSV file has no headers")

        missing_headers = set(EXPECTED_HEADERS) - set(headers)
        if missing_headers:
            raise ValueError(f"Missing required headers: {missing_headers}")

        # Validate first row data types
        first_row = next(csv_reader, None)
        if first_row:
            for field, expected_type in EXPECTED_TYPES.items():
                if field in first_row:
                    try:
                        if expected_type == float:
                            float(first_row[field])
                        elif expected_type == int:
                            int(first_row[field])
                    except ValueError:
                        raise ValueError(
                            f"Invalid data type for field '{field}': "
                            f"expected {expected_type.__name__}"
                        )

        # Update status table
        table = dynamodb.Table(STATUS_TABLE)
        table.update_item(
            Key={'file_id': file_id, 'chunk_id': 'validation'},
            UpdateExpression='SET #status = :status, validation_timestamp = :ts',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'validated',
                ':ts': context.request_id,
            },
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'bucket': bucket,
            'key': key,
            'chunks': event['chunks'],
            'validation': 'passed',
        }

    except Exception as e:
        print(f"Validation error: {str(e)}")
        raise
