"""Payment validation Lambda function."""

import json
import os
import boto3
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """Validate payment transaction."""
    try:
        table_name = os.environ.get('TABLE_NAME')
        table = dynamodb.Table(table_name)
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        amount = body.get('amount')
        currency = body.get('currency', 'USD')
        user_id = body.get('user_id')

        # Validation logic
        if not transaction_id or not amount or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'}),
            }

        if float(amount) <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'}),
            }

        # Store validation result in DynamoDB
        timestamp = int(datetime.utcnow().timestamp())
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
                'user_id': user_id,
                'amount': Decimal(str(amount)),
                'currency': currency,
                'status': 'validated',
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validation successful',
                'transaction_id': transaction_id,
            }),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
        }
