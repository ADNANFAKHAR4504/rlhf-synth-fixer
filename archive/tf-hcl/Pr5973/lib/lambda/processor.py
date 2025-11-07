import json
import boto3
import os

sqs = boto3.client('sqs')

def lambda_handler(event, context):
    """
    Processes validated webhook and forwards to notification queue
    """
    print(f"Received event: {json.dumps(event)}")

    notification_queue_url = os.environ['NOTIFICATION_QUEUE_URL']

    for record in event['Records']:
        try:
            # Parse message body
            body = json.loads(record['body'])

            # Process webhook (simplified - just add processed flag)
            processed_data = {
                'webhookId': body['webhookId'],
                'payload': body['payload'],
                'validated': body.get('validated', False),
                'processed': True,
                'processingStatus': 'success'
            }

            # Forward to notification queue
            sqs.send_message(
                QueueUrl=notification_queue_url,
                MessageBody=json.dumps(processed_data)
            )

            print(f"Processed webhook {body['webhookId']}")

        except Exception as e:
            print(f"Error processing webhook: {str(e)}")
            raise

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }
