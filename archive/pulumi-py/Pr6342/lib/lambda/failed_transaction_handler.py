"""
Failed Transaction Handler Lambda

This Lambda function handles transactions that failed during fraud detection.
It logs failures, stores them for audit, and sends notifications.
"""

import json
import os
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TRANSACTION_TABLE_NAME = os.environ['TRANSACTION_TABLE_NAME']
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

def lambda_handler(event, context):
    """
    Handles failed transactions from DLQ.

    Args:
        event: DLQ event containing failed messages
        context: Lambda context

    Returns:
        Processing results
    """
    results = []

    for record in event['Records']:
        try:
            # Parse DLQ message
            message_body = json.loads(record['body'])

            transaction_id = message_body.get('transaction_id', 'unknown')
            merchant_id = message_body.get('merchant_id', 'unknown')

            # Log failure
            print(f"Processing failed transaction: {transaction_id}")
            print(f"Message: {json.dumps(message_body, indent=2)}")

            # Store failed transaction in DynamoDB with FAILED status
            transaction_table = dynamodb.Table(TRANSACTION_TABLE_NAME)
            timestamp = datetime.now(timezone.utc).isoformat()

            transaction_table.put_item(
                Item={
                    'transaction_id': transaction_id,
                    'timestamp': timestamp,
                    'merchant_id': merchant_id,
                    'amount': message_body.get('amount', 0),
                    'currency': message_body.get('currency', 'USD'),
                    'fraud_status': 'FAILED',
                    'fraud_score': 0,
                    'fraud_reasons': ['Processing failed - moved to DLQ'],
                    'processed_at': timestamp,
                    'failure_reason': 'DLQ processing',
                    'dlq_timestamp': timestamp
                }
            )

            # Send CloudWatch metric
            try:
                cloudwatch.put_metric_data(
                    Namespace='TransactionProcessing',
                    MetricData=[
                        {
                            'MetricName': 'FailedTransactions',
                            'Value': 1,
                            'Unit': 'Count',
                            'Timestamp': datetime.now(timezone.utc),
                            'Dimensions': [
                                {
                                    'Name': 'TransactionStatus',
                                    'Value': 'Failed'
                                }
                            ]
                        }
                    ]
                )
            except Exception as e:
                print(f"Error sending CloudWatch metric: {e}")

            # Send SNS notification for failed transaction
            if SNS_TOPIC_ARN:
                try:
                    alert_message = {
                        'transaction_id': transaction_id,
                        'merchant_id': merchant_id,
                        'status': 'FAILED',
                        'reason': 'Transaction processing failed',
                        'timestamp': timestamp,
                        'original_message': message_body
                    }

                    sns.publish(
                        TopicArn=SNS_TOPIC_ARN,
                        Subject=f'Failed Transaction Alert: {transaction_id}',
                        Message=json.dumps(alert_message, indent=2)
                    )
                except Exception as e:
                    print(f"Error sending SNS notification: {e}")

            results.append({
                'transaction_id': transaction_id,
                'status': 'logged',
                'action': 'stored_in_dynamodb'
            })

        except Exception as e:
            print(f"Error handling failed transaction: {e}")
            results.append({
                'transaction_id': 'unknown',
                'status': 'error',
                'error': str(e)
            })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }
