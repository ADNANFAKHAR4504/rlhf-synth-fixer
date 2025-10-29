import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Optional X-Ray tracing
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
except ImportError:
    # X-Ray SDK not available, continue without tracing
    pass

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_PROCESSED_BUCKET = os.environ['S3_PROCESSED_BUCKET']
ENVIRONMENT = os.environ['ENVIRONMENT']

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def normalize_stripe_event(webhook_data):
    """Normalize Stripe webhook data to standard format"""
    try:
        event_type = webhook_data.get('type', '')
        data_object = webhook_data.get('data', {}).get('object', {})

        # Extract common fields
        transaction_id = webhook_data.get('id', str(uuid.uuid4()))
        amount = data_object.get('amount', 0) / 100  # Stripe uses cents
        currency = data_object.get('currency', 'USD').upper()
        customer_id = data_object.get('customer', 'unknown')
        status = 'processed'

        if 'succeeded' in event_type or 'completed' in event_type:
            status = 'processed'
        elif 'failed' in event_type:
            status = 'failed'
        else:
            status = 'pending'

        return {
            'transaction_id': transaction_id,
            'provider': 'stripe',
            'event_type': event_type,
            'amount': Decimal(str(amount)),
            'currency': currency,
            'customer_id': customer_id,
            'status': status,
            'metadata': {
                'payment_intent': data_object.get('payment_intent'),
                'charge_id': data_object.get('id'),
                'description': data_object.get('description', '')
            }
        }

    except Exception as e:
        print(f"Error normalizing Stripe event: {str(e)}")
        raise


def normalize_paypal_event(webhook_data):
    """Normalize PayPal webhook data to standard format"""
    try:
        event_type = webhook_data.get('event_type', '')
        resource = webhook_data.get('resource', {})

        # Extract common fields
        transaction_id = webhook_data.get('id', str(uuid.uuid4()))
        amount_obj = resource.get('amount', {})
        amount = float(amount_obj.get('value', 0))
        currency = amount_obj.get('currency_code', 'USD')
        customer_id = resource.get('payer', {}).get('email_address', 'unknown')
        status = resource.get('status', 'pending').lower()

        return {
            'transaction_id': transaction_id,
            'provider': 'paypal',
            'event_type': event_type,
            'amount': Decimal(str(amount)),
            'currency': currency,
            'customer_id': customer_id,
            'status': status,
            'metadata': {
                'payment_id': resource.get('id'),
                'intent': resource.get('intent'),
                'state': resource.get('state')
            }
        }

    except Exception as e:
        print(f"Error normalizing PayPal event: {str(e)}")
        raise


def normalize_square_event(webhook_data):
    """Normalize Square webhook data to standard format"""
    try:
        event_type = webhook_data.get('type', '')
        data_object = webhook_data.get('data', {}).get('object', {})

        # Extract common fields
        transaction_id = webhook_data.get('event_id', str(uuid.uuid4()))
        payment = data_object.get('payment', {})
        amount = float(payment.get('amount_money', {}).get('amount', 0)) / 100
        currency = payment.get('amount_money', {}).get('currency', 'USD')
        customer_id = payment.get('customer_id', 'unknown')
        status = payment.get('status', 'pending').lower()

        return {
            'transaction_id': transaction_id,
            'provider': 'square',
            'event_type': event_type,
            'amount': Decimal(str(amount)),
            'currency': currency,
            'customer_id': customer_id,
            'status': status,
            'metadata': {
                'payment_id': payment.get('id'),
                'order_id': payment.get('order_id'),
                'location_id': payment.get('location_id')
            }
        }

    except Exception as e:
        print(f"Error normalizing Square event: {str(e)}")
        raise


@xray_recorder.capture('normalize_webhook_data')
def normalize_webhook_data(provider, webhook_data):
    """Normalize webhook data based on provider"""
    if provider == 'stripe':
        return normalize_stripe_event(webhook_data)
    elif provider == 'paypal':
        return normalize_paypal_event(webhook_data)
    elif provider == 'square':
        return normalize_square_event(webhook_data)
    else:
        raise ValueError(f"Unknown provider: {provider}")


@xray_recorder.capture('write_to_dynamodb')
def write_to_dynamodb(normalized_data, raw_payload_s3_key):
    """Write normalized transaction data to DynamoDB"""
    try:
        now = datetime.utcnow()
        timestamp = int(now.timestamp())

        item = {
            'transaction_id': normalized_data['transaction_id'],
            'timestamp': timestamp,
            'provider': normalized_data['provider'],
            'event_type': normalized_data['event_type'],
            'amount': normalized_data['amount'],
            'currency': normalized_data['currency'],
            'customer_id': normalized_data['customer_id'],
            'status': normalized_data['status'],
            'raw_payload_s3_key': raw_payload_s3_key,
            'processed_at': int(now.timestamp()),
            'metadata': normalized_data.get('metadata', {})
        }

        table.put_item(Item=item)
        print(f"Written to DynamoDB: {normalized_data['transaction_id']}")

        return item

    except Exception as e:
        print(f"Error writing to DynamoDB: {str(e)}")
        raise


@xray_recorder.capture('write_to_s3')
def write_to_s3(normalized_data):
    """Write processed transaction data to S3"""
    try:
        now = datetime.utcnow()
        provider = normalized_data['provider']
        transaction_id = normalized_data['transaction_id']

        # Organize by provider/year/month/day
        s3_key = f"{provider}/{now.year}/{now.month:02d}/{now.day:02d}/{transaction_id}-processed.json"

        s3_client.put_object(
            Bucket=S3_PROCESSED_BUCKET,
            Key=s3_key,
            Body=json.dumps(normalized_data, default=str),
            ContentType='application/json',
            Metadata={
                'provider': provider,
                'transaction_id': transaction_id,
                'environment': ENVIRONMENT
            }
        )

        print(f"Written to S3: {s3_key}")
        return s3_key

    except Exception as e:
        print(f"Error writing to S3: {str(e)}")
        raise


def lambda_handler(event, context):
    """
    Webhook processor Lambda handler

    Processes validated webhook events, normalizes data, and writes to DynamoDB and S3
    """
    try:
        # Extract event data
        provider = event.get('provider')
        transaction_id = event.get('transaction_id')
        raw_payload = event.get('raw_payload', {})
        raw_payload_s3_key = event.get('raw_payload_s3_key')

        # Add X-Ray annotations
        xray_recorder.put_annotation('provider', provider)
        xray_recorder.put_annotation('transaction_id', transaction_id)
        xray_recorder.put_annotation('environment', ENVIRONMENT)

        print(f"Processing webhook: {transaction_id} from {provider}")

        # Normalize webhook data
        normalized_data = normalize_webhook_data(provider, raw_payload)

        # Write to DynamoDB
        dynamodb_item = write_to_dynamodb(normalized_data, raw_payload_s3_key)

        # Write to S3
        processed_s3_key = write_to_s3(normalized_data)

        print(f"Successfully processed transaction: {transaction_id}")
        xray_recorder.put_annotation('processing_status', 'success')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'processed',
                'transaction_id': transaction_id,
                'dynamodb_written': True,
                's3_written': True,
                'processed_s3_key': processed_s3_key
            })
        }

    except Exception as e:
        print(f"ERROR: Failed to process webhook: {str(e)}")
        xray_recorder.put_annotation('processing_status', 'error')
        raise  # Let Lambda retry and eventually send to DLQ
