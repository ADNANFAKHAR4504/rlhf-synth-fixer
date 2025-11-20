"""
Transaction validation Lambda function
"""
import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name)


def handler(event, context):
    """
    Validates financial transactions
    """
    try:
        transaction = event.get('transaction', {})

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'account_id', 'type']
        for field in required_fields:
            if field not in transaction:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'valid': False,
                        'reason': f'Missing required field: {field}'
                    })
                }

        # Validate amount
        amount = Decimal(str(transaction['amount']))
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'valid': False,
                    'reason': 'Amount must be positive'
                })
            }

        # Store validation record in DynamoDB
        table.put_item(
            Item={
                'transactionId': transaction['transaction_id'],
                'accountId': transaction['account_id'],
                'amount': amount,
                'type': transaction['type'],
                'validated': True,
                'timestamp': context.request_id
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'valid': True,
                'transaction_id': transaction['transaction_id']
            })
        }

    except Exception as e:
        print(f"Error validating transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'valid': False,
                'reason': 'Internal validation error'
            })
        }
