"""ingestion.py - Transaction Ingestion Handler"""

import json
import os
import uuid
from datetime import datetime
from decimal import Decimal
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
s3 = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
OUTPUT_QUEUE_URL = os.environ['OUTPUT_QUEUE_URL']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """
    Ingestion Lambda handler

    Processes incoming transactions:
    1. Validates schema
    2. Stores initial state in DynamoDB
    3. Sends to validation queue
    4. Publishes metrics
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Extract transaction data
        if 'transactionId' in event:
            transaction_id = event['transactionId']
            source = event.get('source', 'api')

            # If source is S3, read from bucket
            if source == 's3':
                bucket = event.get('bucket')
                key = event.get('key')

                # Read transaction data from S3
                response = s3.get_object(Bucket=bucket, Key=key)
                transaction_data = json.loads(response['Body'].read().decode('utf-8'))
            else:
                transaction_data = event.get('data', {})
        else:
            # Direct API call format
            transaction_id = str(uuid.uuid4())
            transaction_data = event
            source = 'api'

        # Validate schema
        if not validate_schema(transaction_data):
            raise ValueError("Invalid transaction schema")

        # Prepare DynamoDB item
        timestamp = datetime.utcnow().isoformat()
        item = {
            'transactionId': transaction_id,
            'status': 'INGESTED',
            'timestamp': timestamp,
            'source': source,
            'amount': Decimal(str(transaction_data.get('amount', 0))),
            'currency': transaction_data.get('currency', 'USD'),
            'merchantId': transaction_data.get('merchantId', ''),
            'customerId': transaction_data.get('customerId', ''),
            'rawData': json.dumps(transaction_data),
            'stage': 'ingestion',
            'version': 1
        }

        # Write to DynamoDB
        table.put_item(Item=item)
        print(f"Stored transaction {transaction_id} in DynamoDB")

        # Send to validation queue
        message_body = {
            'transactionId': transaction_id,
            'status': 'READY_FOR_VALIDATION',
            'timestamp': timestamp
        }

        sqs.send_message(
            QueueUrl=OUTPUT_QUEUE_URL,
            MessageBody=json.dumps(message_body)
        )
        print(f"Sent transaction {transaction_id} to validation queue")

        # Publish custom metric
        publish_metric('ProcessingRate', 1, 'Count')

        return {
            'statusCode': 200,
            'transactionId': transaction_id,
            'status': 'INGESTED',
            'timestamp': timestamp
        }

    except Exception as e:
        print(f"Error in ingestion: {str(e)}")

        # Publish error metric
        publish_metric('ErrorCount', 1, 'Count')

        # Send failure notification
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Transaction Ingestion Failed',
                Message=json.dumps({
                    'stage': 'ingestion',
                    'transactionId': event.get('transactionId', 'unknown'),
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sns_error:
            print(f"Failed to send SNS notification: {str(sns_error)}")

        raise


def validate_schema(data):
    """Validate transaction schema"""
    required_fields = ['amount', 'currency', 'merchantId', 'customerId']

    for field in required_fields:
        if field not in data:
            print(f"Missing required field: {field}")
            return False

    # Validate amount is positive
    try:
        amount = float(data['amount'])
        if amount <= 0:
            print("Amount must be positive")
            return False
    except (ValueError, TypeError):
        print("Invalid amount format")
        return False

    return True


def publish_metric(metric_name, value, unit):
    """Publish custom CloudWatch metric"""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'TransactionPipeline/{ENVIRONMENT_SUFFIX}',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Failed to publish metric: {str(e)}")
