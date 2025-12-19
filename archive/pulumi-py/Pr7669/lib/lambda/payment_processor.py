"""
payment_processor.py

Lambda function for processing payment transactions.
"""

import json
import os
import boto3
from botocore.config import Config
from datetime import datetime
from decimal import Decimal

# Use client instead of resource for SDK v3 compatibility and better performance
dynamodb_client = boto3.client('dynamodb',
    config=Config(
        retries={'max_attempts': 3, 'mode': 'adaptive'}
    )
)


def decimal_default(obj):
    """JSON encoder for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def lambda_handler(event, context):
    """Process payment transactions."""

    transactions_table_name = os.environ['TRANSACTIONS_TABLE']

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transactionId')
        customer_id = body.get('customerId')
        amount = body.get('amount')

        if not all([transaction_id, customer_id, amount]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Store transaction using client API
        timestamp = int(datetime.utcnow().timestamp() * 1000)

        dynamodb_client.put_item(
            TableName=transactions_table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'timestamp': {'N': str(timestamp)},
                'customerId': {'S': customer_id},
                'amount': {'N': str(amount)},
                'status': {'S': 'completed'},
                'processedAt': {'S': datetime.utcnow().isoformat()}
            }
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transactionId': transaction_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }