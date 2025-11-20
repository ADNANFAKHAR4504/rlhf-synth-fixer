import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
FAILED_QUEUE_URL = os.environ['FAILED_QUEUE_URL']

table = dynamodb.Table(TRANSACTIONS_TABLE)


def handler(event, context):
    """
    Processes validated payments and updates transaction status.
    Failed processing attempts are sent to SQS for retry.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing transaction_id'
                })
            }

        # Get transaction from DynamoDB
        response = table.get_item(Key={'transaction_id': transaction_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Transaction not found',
                    'transaction_id': transaction_id
                })
            }

        transaction = response['Item']

        # Check if already processed
        if transaction.get('status') == 'processed':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Transaction already processed',
                    'transaction_id': transaction_id,
                    'status': 'processed'
                })
            }

        # Simulate payment processing
        # In real implementation, this would call payment gateway
        timestamp = datetime.utcnow().isoformat()

        # Update transaction status
        table.update_item(
            Key={'transaction_id': transaction_id},
            UpdateExpression='SET #status = :status, updated_at = :timestamp, processed_at = :timestamp',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'processed',
                ':timestamp': timestamp
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'status': 'processed',
                'processed_at': timestamp
            })
        }

    except Exception as e:
        print(f"Processing error: {str(e)}")

        # Send to failed queue for retry
        try:
            sqs.send_message(
                QueueUrl=FAILED_QUEUE_URL,
                MessageBody=json.dumps({
                    'error': str(e),
                    'event': event,
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sqs_error:
            print(f"Failed to send to SQS: {str(sqs_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Processing failed',
                'message': str(e)
            })
        }
