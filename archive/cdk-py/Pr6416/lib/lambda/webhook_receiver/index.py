import json
import os
import boto3
import uuid
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('webhook_receiver')
def handler(event, context):
    """
    Receives webhook from payment providers and stores in DynamoDB
    """
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider', 'unknown')

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Store webhook in DynamoDB
        item = {
            'webhookId': webhook_id,
            'timestamp': timestamp,
            'provider': provider,
            'payload': json.dumps(body),
            'status': 'received',
            'processed': False,
        }

        table.put_item(Item=item)

        # Log receipt
        print(f"Webhook received: {webhook_id} from {provider}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received successfully',
                'webhookId': webhook_id,
            }),
            'headers': {
                'Content-Type': 'application/json',
            },
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e),
            }),
            'headers': {
                'Content-Type': 'application/json',
            },
        }
