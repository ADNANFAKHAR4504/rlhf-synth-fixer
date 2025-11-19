import json
import os
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
FAILED_QUEUE_URL = os.environ['FAILED_QUEUE_URL']

table = dynamodb.Table(TRANSACTIONS_TABLE)


def handler(event, context):
    """
    Validates payment requests and stores them in DynamoDB.
    Failed validations are sent to SQS for retry.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['amount', 'currency', 'customer_id']
        missing_fields = [field for field in required_fields if field not in body]

        if missing_fields:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Validation failed',
                    'missing_fields': missing_fields
                })
            }

        # Validate amount
        amount = body.get('amount')
        if not isinstance(amount, (int, float)) or amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid amount',
                    'message': 'Amount must be a positive number'
                })
            }

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        transaction = {
            'transaction_id': transaction_id,
            'amount': str(amount),
            'currency': body.get('currency'),
            'customer_id': body.get('customer_id'),
            'status': 'validated',
            'created_at': timestamp,
            'updated_at': timestamp
        }

        # Store in DynamoDB
        table.put_item(Item=transaction)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': transaction_id,
                'status': 'validated'
            })
        }

    except Exception as e:
        print(f"Validation error: {str(e)}")

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
                'error': 'Validation failed',
                'message': str(e)
            })
        }
