"""
Lambda function for async payment processing.
"""
import json
import os
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

DB_ENDPOINT = os.environ['DB_ENDPOINT']
BUCKET_NAME = os.environ['BUCKET_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """
    Process payment messages from SQS queue.
    """
    logger.info(f"Processing {len(event['Records'])} payment records")

    successful_payments = 0
    failed_payments = 0

    for record in event['Records']:
        try:
            # Parse message
            message = json.loads(record['body'])
            payment_id = message.get('payment_id')
            amount = message.get('amount')
            customer_id = message.get('customer_id')

            logger.info(f"Processing payment {payment_id} for customer {customer_id}")

            # Process payment logic here
            start_time = datetime.now()

            # Simulate payment processing
            process_payment(payment_id, amount, customer_id)

            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds() * 1000

            # Store receipt in S3
            receipt = {
                'payment_id': payment_id,
                'customer_id': customer_id,
                'amount': amount,
                'timestamp': end_time.isoformat(),
                'status': 'completed'
            }

            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=f"receipts/{payment_id}.json",
                Body=json.dumps(receipt),
                ServerSideEncryption='aws:kms'
            )

            # Send custom metrics
            cloudwatch.put_metric_data(
                Namespace=f'PaymentProcessing/{ENVIRONMENT}',
                MetricData=[
                    {
                        'MetricName': 'TransactionProcessingTime',
                        'Value': processing_time,
                        'Unit': 'Milliseconds',
                        'Timestamp': datetime.now()
                    },
                    {
                        'MetricName': 'TransactionSuccessRate',
                        'Value': 100,
                        'Unit': 'Percent',
                        'Timestamp': datetime.now()
                    }
                ]
            )

            successful_payments += 1
            logger.info(f"Successfully processed payment {payment_id}")

        except Exception as e:
            failed_payments += 1
            logger.error(f"Failed to process payment: {str(e)}")

            # Send failure metric
            cloudwatch.put_metric_data(
                Namespace=f'PaymentProcessing/{ENVIRONMENT}',
                MetricData=[
                    {
                        'MetricName': 'TransactionSuccessRate',
                        'Value': 0,
                        'Unit': 'Percent',
                        'Timestamp': datetime.now()
                    }
                ]
            )

            # Re-raise to send to DLQ
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'successful': successful_payments,
            'failed': failed_payments
        })
    }


def process_payment(payment_id, amount, customer_id):
    """
    Process payment transaction.
    """
    # Add actual payment processing logic here
    # This could involve:
    # - Validating payment details
    # - Checking fraud detection
    # - Connecting to payment gateway
    # - Updating database
    logger.info(f"Processing payment {payment_id} for ${amount}")
