import json
import os
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """
    Process webhook events from different providers.
    Validates the webhook, transforms data, and stores in DynamoDB.
    """
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider', 'unknown')

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate webhook data
        if not body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Empty request body'})
            }

        # Transform data based on provider
        transformed_data = transform_webhook(provider, body)

        # Generate transaction ID and timestamp
        transaction_id = transformed_data.get('transaction_id') or f"{provider}-{int(time.time() * 1000)}"
        timestamp = int(time.time() * 1000)

        # Store in DynamoDB
        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'provider': provider,
            'raw_data': json.dumps(body),
            'transformed_data': json.dumps(transformed_data),
            'status': 'processed'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transaction_id': transaction_id,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def transform_webhook(provider, data):
    """
    Transform webhook data based on provider-specific format.
    """
    transformers = {
        'stripe': transform_stripe,
        'paypal': transform_paypal,
        'square': transform_square
    }

    transformer = transformers.get(provider.lower(), transform_generic)
    return transformer(data)

def transform_stripe(data):
    """Transform Stripe webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('amount'),
        'currency': data.get('currency'),
        'customer_id': data.get('customer'),
        'event_type': data.get('type')
    }

def transform_paypal(data):
    """Transform PayPal webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('purchase_units', [{}])[0].get('amount', {}).get('value'),
        'currency': data.get('purchase_units', [{}])[0].get('amount', {}).get('currency_code'),
        'customer_id': data.get('payer', {}).get('payer_id'),
        'event_type': data.get('event_type')
    }

def transform_square(data):
    """Transform Square webhook format."""
    return {
        'transaction_id': data.get('id'),
        'amount': data.get('amount_money', {}).get('amount'),
        'currency': data.get('amount_money', {}).get('currency'),
        'customer_id': data.get('customer_id'),
        'event_type': data.get('type')
    }

def transform_generic(data):
    """Generic transformation for unknown providers."""
    return {
        'transaction_id': data.get('id') or data.get('transaction_id'),
        'amount': data.get('amount'),
        'currency': data.get('currency'),
        'customer_id': data.get('customer_id'),
        'event_type': data.get('event_type') or data.get('type')
    }
