import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Processes webhook messages in batches and publishes to SNS
    """
    processed_count = 0
    failed_count = 0

    try:
        # Process each message in the batch
        for record in event['Records']:
            try:
                message_body = json.loads(record['body'])
                webhook_id = message_body['webhook_id']
                payload = message_body['payload']

                # Process the webhook
                result = process_webhook(webhook_id, payload)

                # Publish to SNS
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Message=json.dumps({
                        'webhook_id': webhook_id,
                        'status': 'processed',
                        'timestamp': datetime.now().isoformat(),
                        'result': result
                    }),
                    Subject='Webhook Processed',
                    MessageAttributes={
                        'webhook_id': {
                            'DataType': 'String',
                            'StringValue': webhook_id
                        },
                        'status': {
                            'DataType': 'String',
                            'StringValue': 'processed'
                        }
                    }
                )

                processed_count += 1

            except Exception as e:
                print(f"Error processing record: {str(e)}")
                failed_count += 1
                # Re-raise to send message to DLQ after max retries
                raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': processed_count,
                'failed': failed_count
            })
        }

    except Exception as e:
        print(f"Batch processing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_webhook(webhook_id, payload):
    """
    Business logic for processing webhook
    """
    # Implement your webhook processing logic here
    # This is a placeholder that simulates processing

    return {
        'webhook_id': webhook_id,
        'processed_at': datetime.now().isoformat(),
        'payload_size': len(json.dumps(payload))
    }
