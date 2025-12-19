"""
Square Webhook Processor Lambda
Validates and processes Square webhook events
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
    Process Square webhook events and send to SQS queue
    """
    try:
        logger.info(f"Square processor event: {json.dumps(event)}")

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
            'eventId': body.get('event_id', f"square-{datetime.now().timestamp()}"),
            'provider': 'square',
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
        logger.error(f"Error processing Square webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
