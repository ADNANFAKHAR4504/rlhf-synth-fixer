"""Payment processing Lambda function."""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
events_client = boto3.client('events')

REGION = os.environ.get('REGION', 'us-east-1')
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', '')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')


def handler(event, context):
    """Process payment transactions."""
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        transaction_id = body.get('transaction_id', f"txn-{datetime.now().timestamp()}")
        amount = body.get('amount', 0)
        currency = body.get('currency', 'USD')
        session_id = body.get('session_id', context.request_id)

        if amount <= 0:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
                'body': json.dumps({'error': 'Invalid amount', 'region': REGION})
            }

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(Item={
            'session_id': session_id,
            'transaction_id': transaction_id,
            'amount': str(amount),
            'currency': currency,
            'timestamp': datetime.now().isoformat(),
            'region': REGION,
            'status': 'processed',
        })

        # Publish to EventBridge
        events_client.put_events(Entries=[{
            'Source': 'payment.processor',
            'DetailType': 'Payment Transaction',
            'Detail': json.dumps({
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'region': REGION,
                'timestamp': datetime.now().isoformat(),
            }),
        }])

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
            'body': json.dumps({
                'message': 'Payment processed',
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'region': REGION,
                'session_id': session_id,
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'X-Region': REGION},
            'body': json.dumps({'error': str(e), 'region': REGION})
        }