"""
inventory_processor.py

Lambda function to process inventory updates from S3 uploads.
"""

import json
import os
import csv
import time
import boto3
from datetime import datetime
from decimal import Decimal
import logging
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
sqs = boto3.client('sqs')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
DLQ_URL = os.environ.get('DLQ_URL')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

def process_csv_row(row, object_key):
    """Process a single CSV row and return DynamoDB item."""
    item = {
        'product_id': row['product_id'],
        'timestamp': Decimal(str(time.time())),
        'quantity': Decimal(row.get('quantity', '0')),
        'price': Decimal(row.get('price', '0')),
        'warehouse_id': row.get('warehouse_id', 'default'),
        'last_updated': datetime.utcnow().isoformat(),
        'source_file': object_key,
        'environment': ENVIRONMENT
    }

    # Add any additional fields from CSV
    for key, value in row.items():
        if key not in item and value:
            try:
                # Try to convert to Decimal for numeric values
                item[key] = Decimal(value)
            except (ValueError, TypeError):
                item[key] = value

    return item

def handler(event, context):
    """
    Process inventory update files uploaded to S3.
    """
    start_time = time.time()
    records_processed = 0
    file_size = 0

    try:
        # Parse EventBridge event
        if 'detail' in event:
            # EventBridge event format
            bucket_name = event['detail']['bucket']['name']
            object_key = event['detail']['object']['key']
        else:
            # Direct S3 event format (fallback)
            record = event['Records'][0]
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']

        logger.info("Processing file: s3://%s/%s", bucket_name, object_key)

        # Get the object from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_size = response['ContentLength']
        content = response['Body'].read().decode('utf-8')

        # Parse CSV content
        csv_reader = csv.DictReader(content.splitlines())

        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)

        # Process each row
        batch_items = []
        for row in csv_reader:
            try:
                item = process_csv_row(row, object_key)
                batch_items.append(item)

                # Write in batches of 25 (DynamoDB limit)
                if len(batch_items) >= 25:
                    write_batch_to_dynamodb(table, batch_items)
                    records_processed += len(batch_items)
                    batch_items = []

            except Exception as e:
                logger.error("Error processing row: %s, Error: %s", row, str(e))
                send_to_dlq({"row": row, "error": str(e), "file": object_key})

        # Write remaining items
        if batch_items:
            write_batch_to_dynamodb(table, batch_items)
            records_processed += len(batch_items)

        # Calculate processing time
        processing_time = time.time() - start_time

        # Send custom metrics to CloudWatch
        send_metrics(records_processed, file_size, processing_time)

        logger.info("Successfully processed %d records in %.2f seconds",
                   records_processed, processing_time)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Inventory processed successfully',
                'records_processed': records_processed,
                'processing_time': processing_time,
                'file_size': file_size
            })
        }

    except Exception as e:
        logger.error("Error processing inventory: %s", str(e))

        # Send error to DLQ
        if DLQ_URL:
            send_to_dlq({
                "event": event,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })

        # Send error metric
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )

        raise

def write_batch_to_dynamodb(table, items):
    """
    Write a batch of items to DynamoDB.
    """
    try:
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
    except ClientError as e:
        logger.error("Error writing batch to DynamoDB: %s", str(e))
        raise

def send_to_dlq(message):
    """
    Send failed messages to Dead Letter Queue.
    """
    if not DLQ_URL:
        return

    try:
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'Environment': {
                    'StringValue': ENVIRONMENT,
                    'DataType': 'String'
                }
            }
        )
    except Exception as e:
        logger.error("Error sending message to DLQ: %s", str(e))

def send_metrics(records_processed, file_size, processing_time):
    """
    Send custom metrics to CloudWatch.
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'RecordsProcessed',
                    'Value': records_processed,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'FileSize',
                    'Value': file_size,
                    'Unit': 'Bytes',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': processing_time * 1000,  # Convert to milliseconds
                    'Unit': 'Milliseconds',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )
    except Exception as e:
        logger.error("Error sending metrics to CloudWatch: %s", str(e))