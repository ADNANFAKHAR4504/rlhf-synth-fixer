import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb',
                          endpoint_url=os.environ.get('DYNAMODB_ENDPOINT'),
                          region_name=os.environ.get('REGION'))
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))

def handler(event, context):
    """
    Lambda handler for payment processing
    """
    try:
        logger.info(f"Processing payment in region: {os.environ.get('REGION')}")
        logger.info(f"Event: {json.dumps(event)}")

        # Extract payment details from event
        payment_data = json.loads(event.get('body', '{}'))
        transaction_id = payment_data.get('transaction_id')
        amount = payment_data.get('amount')
        currency = payment_data.get('currency', 'USD')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: transaction_id, amount'
                })
            }

        # Store transaction in DynamoDB
        timestamp = int(datetime.now().timestamp())
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
                'amount': str(amount),
                'currency': currency,
                'region': os.environ.get('REGION'),
                'status': 'processed',
                'environment': os.environ.get('ENVIRONMENT_SUFFIX')
            }
        )

        logger.info(f"Transaction {transaction_id} processed successfully")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transaction_id': transaction_id,
                'status': 'processed',
                'region': os.environ.get('REGION'),
                'timestamp': timestamp
            })
        }

    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
