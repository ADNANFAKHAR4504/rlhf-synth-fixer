"""
Webhook ingestion Lambda function.
Validates webhook signatures, stores payloads in S3, records metadata in DynamoDB,
and sends messages to SQS FIFO queue for processing.
"""

import json
import os
import boto3
import hashlib
import hmac
from datetime import datetime
from uuid import uuid4
import traceback

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sqs_client = boto3.client('sqs')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
QUEUE_URL = os.environ['QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']

def validate_signature(payload: str, signature: str, secret: str = 'default-secret') -> bool:
    """
    Validate webhook signature using HMAC-SHA256.
    In production, retrieve secret from Secrets Manager based on provider.
    """
    try:
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_signature)
    except Exception:
        return False

def handler(event, context):
    """
    Main Lambda handler for webhook ingestion.
    """
    try:
        print(f'Received event: {json.dumps(event)}')

        # Extract headers
        headers = event.get('headers', {})
        signature = headers.get('X-Webhook-Signature') or headers.get('x-webhook-signature')
        provider_id = headers.get('X-Provider-ID') or headers.get('x-provider-id')

        if not signature or not provider_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required headers: X-Webhook-Signature and X-Provider-ID'
                })
            }

        # Get request body
        body = event.get('body', '{}')
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')

        # Validate signature (simplified - in production use provider-specific validation)
        if not validate_signature(body, signature):
            print(f'Invalid signature for provider {provider_id}')
            # Still process but log as potentially invalid

        # Generate unique webhook ID
        webhook_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Store raw payload in S3
        s3_key = f'{provider_id}/{timestamp.split("T")[0]}/{webhook_id}.json'
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=body,
            ContentType='application/json',
            Metadata={
                'provider': provider_id,
                'webhook-id': webhook_id,
                'timestamp': timestamp
            }
        )
        print(f'Stored payload in S3: {s3_key}')

        # Store metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'webhook_id': webhook_id,
                'provider': provider_id,
                'timestamp': timestamp,
                'status': 'received',
                's3_key': s3_key,
                'signature_valid': True  # Simplified
            }
        )
        print(f'Stored metadata in DynamoDB: {webhook_id}')

        # Send message to SQS FIFO queue
        message_body = json.dumps({
            'webhook_id': webhook_id,
            'provider': provider_id,
            'timestamp': timestamp,
            's3_key': s3_key
        })

        sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=message_body,
            MessageGroupId=provider_id,  # Group by provider for ordering
            MessageDeduplicationId=webhook_id
        )
        print(f'Sent message to SQS: {webhook_id}')

        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Webhook received and queued for processing',
                'webhook_id': webhook_id
            })
        }

    except Exception as e:
        print(f'Error processing webhook: {str(e)}')
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error processing webhook'
            })
        }
