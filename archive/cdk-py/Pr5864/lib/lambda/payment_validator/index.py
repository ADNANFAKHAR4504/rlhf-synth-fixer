import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Payment validator Lambda function
    Validates incoming payment requests and stores them in DynamoDB
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transaction_id', 'amount', 'currency', 'customer_id']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    })
                }

        # Validate amount
        amount = Decimal(str(body['amount']))
        if amount <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Amount must be greater than zero'
                })
            }

        # Validate currency
        valid_currencies = ['USD', 'EUR', 'GBP']
        if body['currency'] not in valid_currencies:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Invalid currency. Must be one of: {valid_currencies}'
                })
            }

        # Store validation result in DynamoDB
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        table.put_item(
            Item={
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp,
                'status': 'validated',
                'amount': amount,
                'currency': body['currency'],
                'customer_id': body['customer_id'],
                'validated_at': datetime.utcnow().isoformat()
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validated successfully',
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error validating payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during validation'
            })
        }
