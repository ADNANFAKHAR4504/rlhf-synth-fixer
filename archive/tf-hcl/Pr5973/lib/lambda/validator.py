import json
import boto3
import os

sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """
    Validates incoming webhook payload and forwards to processing queue
    """
    print(f"Received event: {json.dumps(event)}")

    processing_queue_url = os.environ['PROCESSING_QUEUE_URL']

    for record in event['Records']:
        try:
            # Parse message body
            body = json.loads(record['body'])

            # Simple validation - check required fields
            if 'webhookId' not in body or 'payload' not in body:
                print(f"Invalid webhook format: {body}")
                continue

            # Forward to processing queue
            sqs.send_message(
                QueueUrl=processing_queue_url,
                MessageBody=json.dumps({
                    'webhookId': body['webhookId'],
                    'payload': body['payload'],
                    'validated': True
                })
            )

            print(f"Validated webhook {body['webhookId']}")

        except Exception as e:
            print(f"Error validating webhook: {str(e)}")
            raise

    return {
        'statusCode': 200,
        'body': json.dumps('Validation complete')
    }
