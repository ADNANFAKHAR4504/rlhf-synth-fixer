"""index.py
Lambda function handler for transaction processing.
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
region = os.environ['REGION']
table = dynamodb.Table(table_name)


def handler(event, context):
    """Process transaction events and store in DynamoDB.

    Args:
        event: Lambda event containing transaction data
        context: Lambda context

    Returns:
        dict: Response with status code and body
    """
    try:
        print(f"Processing transaction in region: {region}")
        print(f"Event: {json.dumps(event)}")

        # Parse request body
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transactionId')
        amount = body.get('amount')
        status = body.get('status', 'pending')

        if not transaction_id or amount is None:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Store transaction in DynamoDB
        timestamp = int(datetime.utcnow().timestamp())
        item = {
            'transactionId': transaction_id,
            'timestamp': timestamp,
            'amount': Decimal(str(amount)),
            'status': status,
            'region': region,
            'processedAt': datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        print(f"Transaction {transaction_id} processed successfully")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transactionId': transaction_id,
                'region': region
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }