"""
Webhook processing Lambda function.
Processes messages from SQS FIFO queue and publishes events to EventBridge.
"""

import json
import os
import boto3
from datetime import datetime
import traceback

# Initialize AWS clients
events_client = boto3.client('events')

# Environment variables
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def handler(event, context):
    """
    Main Lambda handler for processing webhooks from SQS.
    """
    try:
        print(f'Processing batch of {len(event["Records"])} messages')

        for record in event['Records']:
            try:
                # Parse message body
                message_body = json.loads(record['body'])
                webhook_id = message_body['webhook_id']
                provider = message_body['provider']
                timestamp = message_body['timestamp']
                s3_key = message_body['s3_key']

                print(f'Processing webhook {webhook_id} from provider {provider}')

                # Simulate processing logic
                # In production, this would:
                # - Retrieve payload from S3
                # - Validate webhook content
                # - Transform data
                # - Update DynamoDB status

                # Publish event to EventBridge
                event_detail = {
                    'webhook_id': webhook_id,
                    'provider': provider,
                    'timestamp': timestamp,
                    's3_key': s3_key,
                    'processed_at': datetime.utcnow().isoformat(),
                    'status': 'processed'
                }

                events_client.put_events(
                    Entries=[
                        {
                            'Source': 'webhook.processor',
                            'DetailType': 'Webhook Processed',
                            'Detail': json.dumps(event_detail),
                            'EventBusName': EVENT_BUS_NAME
                        }
                    ]
                )

                print(f'Published event to EventBridge for webhook {webhook_id}')

            except Exception as e:
                print(f'Error processing message: {str(e)}')
                print(traceback.format_exc())
                # Let Lambda retry mechanism handle failures
                raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {len(event["Records"])} webhooks'
            })
        }

    except Exception as e:
        print(f'Error in batch processing: {str(e)}')
        print(traceback.format_exc())
        raise  # Trigger SQS retry mechanism
