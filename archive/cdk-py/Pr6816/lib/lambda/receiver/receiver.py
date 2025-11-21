"""Webhook receiver Lambda function"""
import json
import os
import uuid
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TABLE_NAME = os.environ['TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """Process incoming webhook requests"""
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider')

        if not provider:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing provider parameter'})
            }

        # Parse webhook payload
        body = json.loads(event.get('body', '{}'))

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Store in DynamoDB
        table.put_item(
            Item={
                'webhookId': webhook_id,
                'timestamp': timestamp,
                'provider': provider,
                'payload': json.dumps(body),
                'status': 'received',
                'processedAt': 'null',
            }
        )

        # Send to processing queue for async processing
        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps({
                'webhookId': webhook_id,
                'timestamp': timestamp,
                'provider': provider,
            })
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Webhook received',
                'webhookId': webhook_id,
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
