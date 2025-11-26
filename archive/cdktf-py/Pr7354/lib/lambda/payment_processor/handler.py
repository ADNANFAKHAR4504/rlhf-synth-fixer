"""
Payment processor Lambda function handler
Processes payment requests and stores them in DynamoDB Global Table
"""
import json
import os
import time
import uuid
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
kms_client = boto3.client('kms')

# Get environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'payments')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'payment-logs')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')


def validate_payment(payment_data):
    """
    Validate payment request data

    Args:
        payment_data: Dictionary containing payment information

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['amount', 'currency', 'customer_id', 'payment_method']

    for field in required_fields:
        if field not in payment_data:
            return False, f"Missing required field: {field}"

    # Validate amount
    try:
        amount = Decimal(str(payment_data['amount']))
        if amount <= 0:
            return False, "Amount must be greater than 0"
    except (ValueError, TypeError):
        return False, "Invalid amount format"

    # Validate currency
    valid_currencies = ['USD', 'EUR', 'GBP', 'JPY']
    if payment_data['currency'] not in valid_currencies:
        return False, f"Invalid currency. Must be one of: {', '.join(valid_currencies)}"

    return True, None


def process_payment(payment_id, payment_data):
    """
    Process payment and store in DynamoDB

    Args:
        payment_id: Unique payment identifier
        payment_data: Payment information dictionary

    Returns:
        dict: Processing result
    """
    table = dynamodb.Table(TABLE_NAME)
    timestamp = int(time.time() * 1000)

    # Prepare item for DynamoDB
    item = {
        'payment_id': payment_id,
        'timestamp': timestamp,
        'amount': Decimal(str(payment_data['amount'])),
        'currency': payment_data['currency'],
        'customer_id': payment_data['customer_id'],
        'payment_method': payment_data['payment_method'],
        'status': 'completed',
        'processed_at': timestamp,
        'region': os.environ.get('AWS_REGION', 'us-east-1')
    }

    try:
        # Write to DynamoDB
        table.put_item(Item=item)

        # Log to S3 for audit trail
        log_payment_to_s3(payment_id, item)

        return {
            'success': True,
            'payment_id': payment_id,
            'status': 'completed',
            'timestamp': timestamp
        }
    except ClientError as e:
        error_msg = f"DynamoDB error: {e.response['Error']['Message']}"
        print(f"Error processing payment {payment_id}: {error_msg}")

        # Log error to S3
        log_error_to_s3(payment_id, error_msg)

        return {
            'success': False,
            'payment_id': payment_id,
            'status': 'failed',
            'error': error_msg
        }


def log_payment_to_s3(payment_id, payment_data):
    """
    Log payment details to S3 for audit trail

    Args:
        payment_id: Unique payment identifier
        payment_data: Payment information dictionary
    """
    try:
        # Convert Decimal to float for JSON serialization
        serializable_data = json.loads(
            json.dumps(payment_data, default=str),
            parse_float=Decimal
        )

        log_key = f"payments/{time.strftime('%Y/%m/%d')}/{payment_id}.json"

        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=log_key,
            Body=json.dumps(serializable_data, indent=2),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID
        )
    except ClientError as e:
        print(f"Error logging to S3: {e.response['Error']['Message']}")


def log_error_to_s3(payment_id, error_message):
    """
    Log error details to S3

    Args:
        payment_id: Unique payment identifier
        error_message: Error description
    """
    try:
        error_data = {
            'payment_id': payment_id,
            'error': error_message,
            'timestamp': int(time.time() * 1000),
            'region': os.environ.get('AWS_REGION', 'us-east-1')
        }

        log_key = f"errors/{time.strftime('%Y/%m/%d')}/{payment_id}.json"

        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=log_key,
            Body=json.dumps(error_data, indent=2),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=KMS_KEY_ID
        )
    except ClientError as e:
        print(f"Error logging error to S3: {e.response['Error']['Message']}")


def lambda_handler(event, context):
    """
    Main Lambda handler function

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        dict: API Gateway response
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Generate payment ID
        payment_id = str(uuid.uuid4())

        # Validate payment data
        is_valid, error_message = validate_payment(body)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': error_message
                })
            }

        # Process payment
        result = process_payment(payment_id, body)

        # Return response
        status_code = 200 if result['success'] else 500
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str)
        }

    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON in request body: {str(e)}"
        print(error_msg)
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': error_msg
            })
        }
    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        print(error_msg)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error'
            })
        }
