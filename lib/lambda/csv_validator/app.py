"""CSV file validator Lambda function."""

import json
import os
import csv
import io
import base64
import boto3
from datetime import datetime
from typing import Dict, Any, List

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

S3_BUCKET = os.environ['S3_BUCKET']
STATUS_TABLE = os.environ['STATUS_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']

# Define CSV schema
EXPECTED_COLUMNS = ['transaction_id', 'amount', 'currency', 'timestamp', 'merchant', 'status']


def validate_csv_schema(csv_content: str) -> tuple[bool, str, List[Dict[str, Any]]]:
    """
    Validate CSV file against predefined schema.

    Returns:
        tuple: (is_valid, error_message, parsed_rows)
    """
    try:
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        # Check if all expected columns are present
        if not csv_reader.fieldnames:
            return False, "CSV file is empty or has no headers", []

        missing_columns = set(EXPECTED_COLUMNS) - set(csv_reader.fieldnames)
        if missing_columns:
            return False, f"Missing required columns: {', '.join(missing_columns)}", []

        # Validate rows
        parsed_rows = []
        for idx, row in enumerate(csv_reader, start=1):
            # Check for missing values
            empty_fields = [col for col in EXPECTED_COLUMNS if not row.get(col)]
            if empty_fields:
                return False, f"Row {idx} has empty fields: {', '.join(empty_fields)}", []

            # Validate data types
            try:
                float(row['amount'])
            except ValueError:
                return False, f"Row {idx}: Invalid amount value '{row['amount']}'", []

            if row['status'] not in ['completed', 'pending', 'failed']:
                return False, f"Row {idx}: Invalid status '{row['status']}'", []

            parsed_rows.append(row)

        if not parsed_rows:
            return False, "CSV file contains no data rows", []

        return True, "", parsed_rows

    except Exception as e:
        return False, f"CSV parsing error: {str(e)}", []


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


def handler(event, context):
    """
    Lambda handler for CSV validation.

    Handles both API Gateway and direct invocations.
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Handle API Gateway event (multipart/form-data upload)
        if 'body' in event and event.get('isBase64Encoded'):
            # Decode base64 body
            body = base64.b64decode(event['body']).decode('utf-8')

            # Extract file content from multipart form data
            # LIMITATION: This implementation assumes CSV content is sent directly as base64
            # For production use with multipart/form-data:
            # 1. Use python-multipart library to parse form boundaries
            # 2. Or configure API Gateway to accept application/csv with base64 encoding
            file_id = f"upload-{int(datetime.utcnow().timestamp())}"
            csv_content = body

        # Handle direct invocation or Step Functions
        elif 'file_id' in event or 'key' in event:
            file_id = event.get('file_id', event.get('key', 'unknown'))

            # If S3 key provided, fetch file
            if 'bucket' in event and 'key' in event:
                response = s3_client.get_object(
                    Bucket=event['bucket'],
                    Key=event['key']
                )
                csv_content = response['Body'].read().decode('utf-8')
            else:
                csv_content = event.get('csv_content', '')
        else:
            raise ValueError("Invalid event format")

        # Update status: validating
        update_status_table(file_id, 'validating')

        # Validate CSV
        is_valid, error_message, parsed_rows = validate_csv_schema(csv_content)

        if not is_valid:
            # Update status: validation failed
            update_status_table(file_id, 'validation_failed', error_message)

            # Return error response
            result = {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Validation failed',
                    'message': error_message,
                    'file_id': file_id
                })
            }

            if 'body' in event:
                return result
            else:
                return result

        # Store valid CSV in S3
        s3_key = f"validated/{file_id}.csv"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=csv_content,
            ContentType='text/csv'
        )

        # Update status: validated
        update_status_table(
            file_id,
            'validated',
            f"Successfully validated {len(parsed_rows)} rows"
        )

        # Return success response
        result = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File validated successfully',
                'file_id': file_id,
                's3_key': s3_key,
                'row_count': len(parsed_rows)
            })
        }

        if 'body' in event:
            return result
        else:
            return {
                'file_id': file_id,
                's3_key': s3_key,
                'bucket': S3_BUCKET,
                'row_count': len(parsed_rows),
                'status': 'validated'
            }

    except Exception as e:
        print(f"Error: {str(e)}")

        error_result = {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

        if 'body' in event:
            return error_result
        else:
            raise e
