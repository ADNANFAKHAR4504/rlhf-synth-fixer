"""
Transaction Validation Lambda Handler

This Lambda function validates incoming transactions against merchant configurations
stored in DynamoDB. It performs validation checks and sends valid transactions to SQS.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Environment variables
MERCHANT_TABLE_NAME = os.environ['MERCHANT_TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']

def lambda_handler(event, context):
    """
    Validates transaction against merchant configuration.

    Args:
        event: API Gateway event containing transaction data
        context: Lambda context

    Returns:
        API Gateway response with validation status
    """
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('transaction_id')
        merchant_id = body.get('merchant_id')
        amount = body.get('amount')
        currency = body.get('currency', 'USD')

        # Validate required fields
        if not all([transaction_id, merchant_id, amount]):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required fields',
                    'required': ['transaction_id', 'merchant_id', 'amount']
                })
            }

        # Check merchant configuration
        merchant_table = dynamodb.Table(MERCHANT_TABLE_NAME)
        merchant_response = merchant_table.get_item(
            Key={'merchant_id': merchant_id}
        )

        if 'Item' not in merchant_response:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Merchant not found',
                    'merchant_id': merchant_id
                })
            }

        merchant = merchant_response['Item']

        # Validate merchant is active
        if not merchant.get('active', False):
            return {
                'statusCode': 403,
                'body': json.dumps({
                    'error': 'Merchant not active',
                    'merchant_id': merchant_id
                })
            }

        # Validate transaction amount limits
        max_amount = float(merchant.get('max_transaction_amount', 10000))
        if float(amount) > max_amount:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Amount exceeds merchant limit',
                    'max_amount': max_amount,
                    'requested': amount
                })
            }

        # Send valid transaction to SQS for fraud detection
        message = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': amount,
            'currency': currency,
            'merchant_name': merchant.get('name', 'Unknown'),
            'timestamp': context.request_id
        }

        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'TransactionId': {
                    'StringValue': transaction_id,
                    'DataType': 'String'
                },
                'MerchantId': {
                    'StringValue': merchant_id,
                    'DataType': 'String'
                }
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated and queued',
                'transaction_id': transaction_id,
                'status': 'pending_fraud_check'
            })
        }

    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
