"""
Stripe Webhook Processor Lambda
Validates and processes Stripe webhook events
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs_client = boto3.client('sqs')


def lambda_handler(event, context):
    """
    Process Stripe webhook events and send to SQS queue
    """
    try:
        logger.info(f"Stripe processor event: {json.dumps(event)}")

        # Parse the webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Validate required fields
        if not body:
            raise ValueError("Empty webhook payload")

        # Transform to standard format
        webhook_event = {
            'eventId': body.get('id', f"stripe-{datetime.now().timestamp()}"),
            'provider': 'stripe',
            'type': body.get('type', 'unknown'),
            'timestamp': int(datetime.now().timestamp()),
            'payload': json.dumps(body)
        }

        # Send to SQS
        queue_url = os.environ['QUEUE_URL']
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(webhook_event)
        )

        logger.info(f"Message sent to SQS: {response['MessageId']}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Webhook processed successfully'})
        }

    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
