"""API Handler Lambda for transaction ingestion."""
import json
import os
import time
import uuid
import boto3
from decimal import Decimal


# Initialize boto3 resources (can be mocked for testing)
def get_table():
    """Get DynamoDB table resource."""
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ.get('DYNAMODB_TABLE', 'transactions-test')
    return dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Handle POST requests to /transactions endpoint.
    Validates transaction data and stores it in DynamoDB.

    Args:
        event: API Gateway proxy event
        context: Lambda context

    Returns:
        API Gateway proxy response
    """
    try:
        # Parse request body
        if 'body' not in event:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing request body'})
            }

        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']

        # Validate required fields
        required_fields = ['amount', 'merchant', 'card_number']
        missing_fields = [field for field in required_fields if field not in body]

        if missing_fields:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                })
            }

        # Generate transaction ID and timestamp
        transaction_id = body.get('transaction_id', str(uuid.uuid4()))
        timestamp = int(time.time() * 1000)

        # Prepare transaction item
        transaction = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'amount': Decimal(str(body['amount'])),
            'merchant': body['merchant'],
            'card_number': body['card_number'],
            'status': 'pending'
        }

        # Add optional fields
        if 'location' in body:
            transaction['location'] = body['location']
        if 'customer_id' in body:
            transaction['customer_id'] = body['customer_id']
        if 'currency' in body:
            transaction['currency'] = body['currency']

        # Write to DynamoDB
        table = get_table()
        table.put_item(Item=transaction)

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Transaction recorded successfully',
                'transaction_id': transaction_id,
                'timestamp': timestamp
            })
        }

    except ValueError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Invalid data format: {str(e)}'})
        }
    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
