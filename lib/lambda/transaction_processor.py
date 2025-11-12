import json
import boto3
import os
import time
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-east-2'))
table_name = os.environ.get('TABLE_NAME')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda handler for processing transaction submissions and retrievals

    Handles:
    - POST /transactions: Submit new transaction
    - GET /transactions/{id}: Retrieve transaction by ID
    """

    try:
        http_method = event.get('httpMethod')

        if http_method == 'POST':
            return handle_post_transaction(event, context)
        elif http_method == 'GET':
            return handle_get_transaction(event, context)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_post_transaction(event, context):
    """Handle POST /transactions - submit new transaction"""

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['transactionId', 'amount', 'currency', 'customerId']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Add timestamp
        timestamp = int(time.time() * 1000)

        # Convert float to Decimal for DynamoDB
        transaction_data = {
            'transactionId': body['transactionId'],
            'timestamp': timestamp,
            'amount': Decimal(str(body['amount'])),
            'currency': body['currency'],
            'customerId': body['customerId'],
            'status': 'pending',
            'fraudScore': Decimal('0'),
            'metadata': body.get('metadata', {})
        }

        # Store in DynamoDB
        table.put_item(Item=transaction_data)

        print(f"Transaction stored: {body['transactionId']}")

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Transaction submitted successfully',
                'transactionId': body['transactionId'],
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error submitting transaction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to submit transaction'})
        }

def handle_get_transaction(event, context):
    """Handle GET /transactions/{id} - retrieve transaction by ID"""

    try:
        # Extract transaction ID from path parameters
        path_parameters = event.get('pathParameters', {})
        transaction_id = path_parameters.get('id')

        if not transaction_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Transaction ID is required'})
            }

        # Query DynamoDB
        response = table.query(
            KeyConditionExpression='transactionId = :tid',
            ExpressionAttributeValues={
                ':tid': transaction_id
            },
            Limit=1,
            ScanIndexForward=False  # Get latest
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Transaction not found'})
            }

        # Convert Decimal to float for JSON serialization
        transaction = items[0]
        transaction['amount'] = float(transaction['amount'])
        transaction['fraudScore'] = float(transaction['fraudScore'])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(transaction)
        }

    except Exception as e:
        print(f"Error retrieving transaction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to retrieve transaction'})
        }
