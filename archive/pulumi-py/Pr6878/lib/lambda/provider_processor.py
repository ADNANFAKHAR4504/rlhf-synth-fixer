"""
Provider-specific webhook processing Lambda function.

This function processes webhooks from SQS queues for specific providers,
ensures idempotency via DynamoDB, and publishes events to EventBridge.
"""

import json
import boto3
import os
from datetime import datetime


def provider_processor_handler(event, context):
    """Process webhooks from SQS for specific provider"""
    try:
        provider = os.environ['PROVIDER']
        
        for record in event['Records']:
            # Parse message
            message_body = json.loads(record['body'])
            webhook_id = record['messageAttributes']['webhook_id']['stringValue']
            
            print(f"Processing webhook {webhook_id} for provider {provider}")
            
            # Check idempotency in DynamoDB
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
            
            response = table.get_item(Key={'webhook_id': webhook_id})
            if 'Item' in response:
                print(f"Webhook {webhook_id} already processed, skipping")
                continue
            
            # Process payment (provider-specific logic)
            payment_amount = message_body.get('amount', 0)
            payment_type = message_body.get('type', 'unknown')
            
            # Provider-specific processing logic
            processed_data = process_provider_webhook(provider, message_body)
            
            # Save to DynamoDB for idempotency
            table.put_item(
                Item={
                    'webhook_id': webhook_id,
                    'provider': provider,
                    'status': 'processed',
                    'timestamp': datetime.utcnow().isoformat(),
                    'amount': payment_amount,
                    'payment_type': payment_type,
                    'processed_data': processed_data
                }
            )
            
            # Send to EventBridge
            eventbridge = boto3.client('events')
            eventbridge.put_events(
                Entries=[
                    {
                        'Source': 'webhook.processor',
                        'DetailType': 'Payment Processed',
                        'Detail': json.dumps({
                            'webhook_id': webhook_id,
                            'provider': provider,
                            'amount': payment_amount,
                            'payment_type': payment_type,
                            'timestamp': datetime.utcnow().isoformat(),
                            'processed_data': processed_data
                        }),
                        'EventBusName': os.environ['EVENT_BUS_NAME']
                    }
                ]
            )
            
            print(f"Successfully processed webhook {webhook_id}")
        
        return {'statusCode': 200}
    except Exception as e:
        print(f"Error processing webhooks: {str(e)}")
        raise


def process_provider_webhook(provider, webhook_data):
    """Process webhook data based on provider-specific logic"""
    
    if provider == 'stripe':
        return {
            'stripe_event_type': webhook_data.get('type'),
            'stripe_object_id': webhook_data.get('data', {}).get('object', {}).get('id'),
            'currency': webhook_data.get('data', {}).get('object', {}).get('currency', 'usd')
        }
    
    elif provider == 'paypal':
        return {
            'paypal_event_type': webhook_data.get('event_type'),
            'paypal_transaction_id': webhook_data.get('resource', {}).get('id'),
            'payment_state': webhook_data.get('resource', {}).get('state', 'unknown')
        }
    
    elif provider == 'square':
        return {
            'square_event_type': webhook_data.get('type'),
            'square_payment_id': webhook_data.get('data', {}).get('object', {}).get('payment', {}).get('id'),
            'location_id': webhook_data.get('data', {}).get('object', {}).get('payment', {}).get('location_id')
        }
    
    else:
        return {'provider': provider, 'raw_data_keys': list(webhook_data.keys())}