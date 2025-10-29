"""
Transaction Receiver Lambda Handler

Receives transaction requests from API Gateway and stores them in DynamoDB.
"""

import json
import os
import time
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')


def handler(event, context):
    """
    Handle incoming transaction requests.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')
        
        if not transaction_id or amount is None:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        timestamp = int(time.time())
        
        table_name = os.environ['TRANSACTIONS_TABLE']
        table = dynamodb.Table(table_name)
        
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': Decimal(str(amount)),
                'timestamp': timestamp,
                'status': 'received'
            }
        )
        
        eventbridge.put_events(
            Entries=[{
                'Source': 'transaction.receiver',
                'DetailType': 'TransactionReceived',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'amount': float(amount),
                    'timestamp': timestamp
                }),
                'EventBusName': 'default'
            }]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction received',
                'transaction_id': transaction_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

