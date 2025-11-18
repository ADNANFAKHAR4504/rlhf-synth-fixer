import json
import os
import boto3
from datetime import datetime

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

MERCHANT_TABLE = os.environ['MERCHANT_TABLE']
TRANSACTION_QUEUE_URL = os.environ['TRANSACTION_QUEUE_URL']

merchant_table = dynamodb.Table(MERCHANT_TABLE)


def handler(event, context):
    """
    Validates incoming transactions against merchant configurations.
    Enhanced with X-Ray tracing and better error handling.
    """
    try:
        body = json.loads(event['body'])

        merchant_id = body.get('merchant_id')
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        # Validate required fields
        if not all([merchant_id, transaction_id, amount]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Missing required fields: merchant_id, transaction_id, amount'})
            }

        # Validate amount is numeric
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'error': 'Amount must be greater than zero'})
                }
        except ValueError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Invalid amount format'})
            }

        # Check merchant configuration with X-Ray subsegment
        with xray_recorder.capture('get_merchant_config'):
            response = merchant_table.get_item(Key={'merchant_id': merchant_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Merchant not found'})
            }

        merchant = response['Item']

        # Validate transaction amount against merchant limits
        max_amount = float(merchant.get('max_transaction_amount', 10000))
        if amount_float > max_amount:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Transaction amount exceeds merchant limit',
                    'max_allowed': max_amount
                })
            }

        # Send valid transaction to SQS with X-Ray subsegment
        message = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': amount_float,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'validated'
        }

        with xray_recorder.capture('send_to_sqs'):
            sqs.send_message(
                QueueUrl=TRANSACTION_QUEUE_URL,
                MessageBody=json.dumps(message)
            )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Transaction validated successfully',
                'transaction_id': transaction_id,
                'status': 'validated'
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }