"""Payment API handler Lambda function."""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

PAYMENTS_TABLE = os.environ['PAYMENTS_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    """Handle payment API requests."""
    try:
        http_method = event.get('httpMethod')
        path = event.get('path', '')

        payments_table = dynamodb.Table(PAYMENTS_TABLE)

        # POST /payments - Create payment
        if http_method == 'POST' and '/payments' in path:
            body = json.loads(event.get('body', '{}'))

            payment_id = body.get('payment_id')
            amount = body.get('amount')
            currency = body.get('currency', 'USD')

            if not payment_id or not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Missing required fields: payment_id, amount'})
                }

            if amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Amount must be greater than 0'})
                }

            timestamp = int(datetime.utcnow().timestamp())

            payments_table.put_item(
                Item={
                    'payment_id': payment_id,
                    'amount': Decimal(str(amount)),
                    'currency': currency,
                    'status': 'pending',
                    'timestamp': timestamp,
                    'environment': ENVIRONMENT,
                    'created_at': datetime.utcnow().isoformat()
                }
            )

            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'message': 'Payment created successfully',
                    'payment_id': payment_id,
                    'status': 'pending'
                })
            }

        # GET /payments/{id} - Get payment status
        elif http_method == 'GET':
            # Extract payment ID from path
            path_parts = path.strip('/').split('/')
            if len(path_parts) >= 2:
                payment_id = path_parts[-1]

                response = payments_table.get_item(
                    Key={'payment_id': payment_id}
                )

                if 'Item' in response:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps(response['Item'], cls=DecimalEncoder)
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Payment not found'})
                    }

        # Method not supported
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    except Exception as e:
        print(f"Error handling API request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
