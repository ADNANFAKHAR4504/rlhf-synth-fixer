"""Payment validation Lambda function."""
import json
import os
import boto3
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE_NAME']
PROCESSING_QUEUE_URL = os.environ['PROCESSING_QUEUE_URL']

def validate_payment(payment_data):
    """Validate payment data structure and content."""
    required_fields = ['transaction_id', 'amount', 'currency', 'customer_id', 'payment_method']

    for field in required_fields:
        if field not in payment_data:
            return False, f"Missing required field: {field}"

    try:
        amount = Decimal(str(payment_data['amount']))
        if amount <= 0:
            return False, "Amount must be positive"
        if amount > Decimal('100000'):
            return False, "Amount exceeds maximum limit"
    except (ValueError, TypeError):
        return False, "Invalid amount format"

    if payment_data['currency'] not in ['USD', 'EUR', 'GBP']:
        return False, "Unsupported currency"

    if len(payment_data['customer_id']) < 5:
        return False, "Invalid customer ID"

    return True, "Validation successful"

def lambda_handler(event, context):
    """Handle payment validation requests."""
    try:
        # Parse the incoming request
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        # Validate the payment data
        is_valid, message = validate_payment(body)

        if not is_valid:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'status': 'validation_failed',
                    'message': message
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # Store transaction in DynamoDB
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        timestamp = datetime.utcnow().isoformat()

        table.put_item(
            Item={
                'transaction_id': body['transaction_id'],
                'status': 'validated',
                'amount': str(body['amount']),
                'currency': body['currency'],
                'customer_id': body['customer_id'],
                'payment_method': body['payment_method'],
                'created_at': timestamp,
                'updated_at': timestamp,
                'region': os.environ.get('DEPLOYMENT_REGION', os.environ.get('AWS_REGION', 'unknown'))
            }
        )

        # Send to processing queue
        sqs.send_message(
            QueueUrl=PROCESSING_QUEUE_URL,
            MessageBody=json.dumps(body),
            MessageAttributes={
                'transaction_id': {
                    'DataType': 'String',
                    'StringValue': body['transaction_id']
                },
                'validation_timestamp': {
                    'DataType': 'String',
                    'StringValue': timestamp
                }
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'validated',
                'transaction_id': body['transaction_id'],
                'message': 'Payment validated successfully'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

    except Exception as e:
        print(f"Error processing validation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'message': 'Internal server error'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
