import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

def validate_payload(payload):
    """Validate incoming webhook payload"""
    required_fields = ['transaction_id', 'amount', 'currency', 'provider']

    for field in required_fields:
        if field not in payload:
            raise ValueError(f"Missing required field: {field}")

    # Validate amount is positive
    if float(payload['amount']) <= 0:
        raise ValueError("Amount must be positive")

    # Validate currency is 3-letter code
    if len(payload['currency']) != 3:
        raise ValueError("Currency must be 3-letter code")

    return True

def lambda_handler(event, context):
    """Process incoming payment webhook"""

    table_name = os.environ['TABLE_NAME']
    queue_url = os.environ['QUEUE_URL']

    try:
        # Parse request body
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})

        # Validate payload
        validate_payload(body)

        # Prepare DynamoDB item
        timestamp = datetime.utcnow().isoformat()
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'amount': Decimal(str(body['amount'])),
            'currency': body['currency'],
            'provider': body['provider'],
            'status': 'received',
            'metadata': body.get('metadata', {})
        }

        # Write to DynamoDB
        table = dynamodb.Table(table_name)
        table.put_item(Item=item)

        # Send message to SQS for downstream processing
        message = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'amount': float(body['amount']),
            'currency': body['currency'],
            'provider': body['provider']
        }

        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message)
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': body['transaction_id']
            })
        }

    except ValueError as e:
        # Validation error
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Validation error',
                'message': str(e)
            })
        }

    except Exception as e:
        # Unexpected error
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': 'Failed to process payment'
            })
        }
