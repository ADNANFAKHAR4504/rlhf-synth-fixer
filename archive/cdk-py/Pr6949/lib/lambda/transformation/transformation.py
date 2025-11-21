"""
Lambda function for transforming financial transaction files.

This function transforms validated CSV and JSON files, applies business rules,
uploads processed data to S3, and updates DynamoDB tracking status.
"""

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Transform validated transaction files.

    Args:
        event: Event from validation step containing file information
        context: Lambda context

    Returns:
        dict: Status with file_id, output bucket, key, and transformation result

    Raises:
        Exception: If transformation fails or S3 upload fails
    """

    # Extract file information from validation output
    file_id = event['file_id']
    bucket = event['bucket']
    key = event['key']

    table_name = os.environ['TABLE_NAME']
    processed_bucket = os.environ['PROCESSED_BUCKET']
    table = dynamodb.Table(table_name)

    # Update status to transforming
    table.update_item(
        Key={'file_id': file_id},
        UpdateExpression='SET #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'TRANSFORMING'}
    )

    try:
        # Download file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')

        # Transform based on file format
        if key.endswith('.csv'):
            transformed = transform_csv(content)
        elif key.endswith('.json'):
            transformed = transform_json(content)
        else:
            raise ValueError(f"Unsupported file format: {key}")

        # Upload transformed data to processed bucket
        output_key = f"processed/{file_id}.json"
        s3_client.put_object(
            Bucket=processed_bucket,
            Key=output_key,
            Body=json.dumps(transformed, indent=2),
            ContentType='application/json'
        )

        # Update status to completed
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, processed_at = :timestamp, output_key = :output',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':timestamp': datetime.utcnow().isoformat(),
                ':output': output_key
            }
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'output_bucket': processed_bucket,
            'output_key': output_key,
            'transformation': 'completed'
        }

    except Exception as e:
        # Update status to transformation failed
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, error = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'TRANSFORMATION_FAILED',
                ':error': str(e)
            }
        )
        raise


def transform_csv(content):
    """
    Transform CSV to JSON and apply business rules.

    Args:
        content: CSV file content as string

    Returns:
        list: List of transformed transaction dictionaries
    """
    lines = content.strip().split('\n')
    header = lines[0].split(',')

    transactions = []
    for line in lines[1:]:
        if not line.strip():
            continue
        values = line.split(',')
        transaction = dict(zip(header, values))

        # Apply business rules
        transaction['amount'] = float(transaction['amount'])
        transaction['processed_timestamp'] = datetime.utcnow().isoformat()
        transaction['currency'] = 'USD'

        # Calculate fee (1% of transaction amount)
        transaction['fee'] = round(transaction['amount'] * 0.01, 2)

        transactions.append(transaction)

    return transactions


def transform_json(content):
    """
    Transform JSON and apply business rules.

    Args:
        content: JSON file content as string

    Returns:
        list: List of transformed transaction dictionaries
    """
    data = json.loads(content)

    for transaction in data:
        # Apply business rules
        transaction['amount'] = float(transaction['amount'])
        transaction['processed_timestamp'] = datetime.utcnow().isoformat()
        transaction['currency'] = 'USD'

        # Calculate fee (1% of transaction amount)
        transaction['fee'] = round(transaction['amount'] * 0.01, 2)

    return data
