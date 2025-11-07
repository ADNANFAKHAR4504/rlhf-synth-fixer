import json
import os
import time
import uuid
import hashlib
import hmac
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']

# For demo purposes - in production, retrieve from Secrets Manager
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'default-secret-key')

def lambda_handler(event, context):
    """
    Validates webhook signature and stores payload in DynamoDB
    """
    try:
        # Parse the incoming webhook
        body = json.loads(event.get('body', '{}'))
        headers = event.get('headers', {})

        # Validate signature
        signature = headers.get('X-Webhook-Signature', '')
        if not validate_signature(event.get('body', ''), signature):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())

        # Calculate expiry time (30 days from now)
        expiry_time = int((datetime.now() + timedelta(days=30)).timestamp())

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(
            Item={
                'webhook_id': webhook_id,
                'payload': json.dumps(body),
                'timestamp': int(time.time()),
                'expiry_time': expiry_time,
                'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            }
        )

        # Send to SQS for processing
        message_group_id = body.get('merchant_id', 'default')
        deduplication_id = f"{webhook_id}-{int(time.time())}"

        sqs.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps({
                'webhook_id': webhook_id,
                'payload': body
            }),
            MessageGroupId=message_group_id,
            MessageDeduplicationId=deduplication_id
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received and queued for processing',
                'webhook_id': webhook_id
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def validate_signature(payload, signature):
    """
    Validates webhook signature using HMAC SHA256
    """
    if not signature:
        return False

    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
