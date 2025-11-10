import json
import os
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Process incoming webhook events and store in DynamoDB.
    Validates request body and extracts transaction data.
    """
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing request body'})
            }

        # Validate required fields
        if 'transaction_id' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id'})
            }

        # Prepare transaction record
        timestamp = int(time.time() * 1000)
        transaction = {
            'transaction_id': body['transaction_id'],
            'timestamp': timestamp,
            'provider': body.get('provider', 'unknown'),
            'amount': Decimal(str(body.get('amount', 0))),
            'currency': body.get('currency', 'USD'),
            'status': body.get('status', 'pending'),
            'metadata': json.dumps(body.get('metadata', {})),
            'received_at': timestamp
        }

        # Write to DynamoDB
        table.put_item(Item=transaction)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': body['transaction_id'],
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
