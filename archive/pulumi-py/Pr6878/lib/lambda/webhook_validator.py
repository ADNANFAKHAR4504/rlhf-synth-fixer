"""
Webhook validation Lambda function.

This function receives webhook notifications from the API Gateway,
validates the provider, and publishes messages to the appropriate SQS queue.
"""

import json
import boto3
import hashlib
import os
from datetime import datetime


def webhook_validator_handler(event, context):
    """Validate incoming webhooks and publish to appropriate SQS queue"""
    try:
        # Extract provider from path
        provider = event['pathParameters']['provider']
        
        # Validate provider
        if provider not in ['stripe', 'paypal', 'square']:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid provider'})
            }
        
        # Parse webhook body
        body = json.loads(event['body'])
        webhook_id = body.get('id', hashlib.md5(event['body'].encode()).hexdigest())
        
        # Send to SQS
        sqs = boto3.client('sqs')
        queue_url = os.environ[f'{provider.upper()}_QUEUE_URL']
        
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=event['body'],
            MessageGroupId=provider,
            MessageDeduplicationId=webhook_id,
            MessageAttributes={
                'provider': {'StringValue': provider, 'DataType': 'String'},
                'webhook_id': {'StringValue': webhook_id, 'DataType': 'String'}
            }
        )
        
        print(f"Message sent to {provider} queue: {response['MessageId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received',
                'webhook_id': webhook_id,
                'provider': provider
            })
        }
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }