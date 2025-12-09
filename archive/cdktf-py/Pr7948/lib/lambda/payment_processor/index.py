"""Payment processor Lambda function"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """Process payment transactions"""

    try:
        # Parse request
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        transaction_id = body.get('transactionId')
        customer_id = body.get('customerId')
        amount = Decimal(str(body.get('amount', 0)))
        currency = body.get('currency', 'USD')

        if not transaction_id or not customer_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required fields: transactionId, customerId'
                })
            }

        # Store transaction in DynamoDB
        timestamp = int(datetime.utcnow().timestamp())

        item = {
            'transactionId': transaction_id,
            'timestamp': timestamp,
            'customerId': customer_id,
            'amount': amount,
            'currency': currency,
            'status': 'processed',
            'region': os.environ['REGION'],
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transactionId': transaction_id,
                'status': 'processed',
                'region': os.environ['REGION']
            }, default=str)
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
