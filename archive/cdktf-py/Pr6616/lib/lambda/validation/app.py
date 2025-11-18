"""Lambda function for validating CSV files and storing in S3."""

import json
import base64
import os
import csv
import io
from typing import Dict, Any
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ['BUCKET_NAME']


@xray_recorder.capture('validate_csv_schema')
def validate_csv_schema(csv_content: str) -> tuple[bool, str]:
    """
    Validate CSV file against predefined schema.

    Expected columns: transaction_id, amount, currency, timestamp, bank_id
    """
    try:
        csv_file = io.StringIO(csv_content)
        reader = csv.DictReader(csv_file)

        required_columns = {'transaction_id', 'amount', 'currency', 'timestamp', 'bank_id'}

        # Check headers
        if not reader.fieldnames:
            return False, "CSV file is empty or has no headers"

        headers = set(reader.fieldnames)
        missing_columns = required_columns - headers

        if missing_columns:
            return False, f"Missing required columns: {', '.join(missing_columns)}"

        # Validate at least one row exists
        row_count = 0
        for row in reader:
            row_count += 1
            # Validate required fields are not empty
            for col in required_columns:
                if not row.get(col):
                    return False, f"Row {row_count}: Missing value for {col}"

        if row_count == 0:
            return False, "CSV file contains no data rows"

        return True, f"Valid CSV with {row_count} transactions"

    except Exception as e:
        return False, f"CSV parsing error: {str(e)}"


@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for validating uploaded CSV files.

    Accepts multipart/form-data from API Gateway, validates CSV schema,
    and stores valid files in S3.
    """
    try:
        # Parse the request body
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']

        # Extract CSV content from multipart form data
        # For simplicity, assuming body contains CSV content directly
        # In production, you would parse multipart/form-data properly
        csv_content = body

        # Validate CSV schema
        is_valid, message = validate_csv_schema(csv_content)

        if not is_valid:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'status': 'error',
                    'message': message
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }

        # Generate unique file name
        request_id = context.request_id
        file_key = f"validated/{request_id}.csv"

        # Store valid file in S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=file_key,
            Body=csv_content.encode('utf-8'),
            ContentType='text/csv',
            Metadata={
                'validation_status': 'valid',
                'request_id': request_id
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'message': message,
                'file_key': file_key,
                'request_id': request_id
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'message': f"Internal server error: {str(e)}"
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
