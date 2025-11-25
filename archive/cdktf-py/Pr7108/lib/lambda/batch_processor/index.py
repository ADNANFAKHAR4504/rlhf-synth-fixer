"""Batch payment processor Lambda function."""

import json
import os
import boto3
import csv
from io import StringIO
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

PROCESSING_STATUS_TABLE = os.environ['PROCESSING_STATUS_TABLE']
PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
PAYMENT_QUEUE_URL = os.environ['PAYMENT_QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """Process batch payment files from S3."""
    try:
        # Get S3 event details
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(f"Processing file: s3://{bucket}/{key}")

            # Generate batch ID
            batch_id = f"batch-{datetime.utcnow().timestamp()}"
            timestamp = int(datetime.utcnow().timestamp())

            # Update processing status
            status_table = dynamodb.Table(PROCESSING_STATUS_TABLE)
            status_table.put_item(
                Item={
                    'batch_id': batch_id,
                    'file_key': key,
                    'status': 'processing',
                    'created_at': timestamp,
                    'environment': ENVIRONMENT
                }
            )

            # Download and process CSV file
            response = s3.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')

            csv_reader = csv.DictReader(StringIO(csv_content))
            payments_table = dynamodb.Table(PAYMENTS_TABLE)

            processed_count = 0
            for row in csv_reader:
                payment_id = row.get('payment_id')
                amount = float(row.get('amount', 0))
                currency = row.get('currency', 'USD')

                # Store payment record
                payments_table.put_item(
                    Item={
                        'payment_id': payment_id,
                        'amount': amount,
                        'currency': currency,
                        'status': 'pending',
                        'timestamp': timestamp,
                        'batch_id': batch_id,
                        'environment': ENVIRONMENT
                    }
                )

                # Queue for processing
                sqs.send_message(
                    QueueUrl=PAYMENT_QUEUE_URL,
                    MessageBody=json.dumps({
                        'payment_id': payment_id,
                        'amount': amount,
                        'currency': currency,
                        'batch_id': batch_id
                    })
                )

                processed_count += 1

            # Update status to completed
            status_table.update_item(
                Key={'batch_id': batch_id},
                UpdateExpression='SET #status = :status, processed_count = :count',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':count': processed_count
                }
            )

            print(f"Processed {processed_count} payments from batch {batch_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Batch processing completed'})
        }

    except Exception as e:
        print(f"Error processing batch: {str(e)}")
        # Update status to failed
        if 'batch_id' in locals():
            status_table = dynamodb.Table(PROCESSING_STATUS_TABLE)
            status_table.update_item(
                Key={'batch_id': batch_id},
                UpdateExpression='SET #status = :status, error_message = :error',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e)
                }
            )
        raise
