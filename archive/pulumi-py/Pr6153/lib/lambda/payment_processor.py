"""Lambda function for processing payment transactions."""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)


def handler(event, context):
    """Process payment transaction requests."""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transactionId')
        amount = body.get('amount')
        currency = body.get('currency', 'USD')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'}),
            }

        # Store transaction in DynamoDB
        timestamp = int(datetime.now().timestamp())
        table.put_item(
            Item={
                'transactionId': transaction_id,
                'timestamp': timestamp,
                'amount': str(amount),
                'currency': currency,
                'status': 'pending',
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed',
                'transactionId': transaction_id,
                'timestamp': timestamp,
            }),
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
        }
