import json
import os
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('payment_processor')
def handler(event, context):
    """
    Processes payment webhooks asynchronously
    """
    try:
        # Process webhook (placeholder for actual business logic)
        webhook_id = event.get('webhookId')
        provider = event.get('provider')
        payload = event.get('payload')

        print(f"Processing webhook: {webhook_id} from {provider}")

        # Simulate payment processing
        # In production, this would validate signatures, process payments, etc.

        # Update webhook status
        table.update_item(
            Key={
                'webhookId': webhook_id,
                'timestamp': event.get('timestamp'),
            },
            UpdateExpression='SET #status = :status, processed = :processed',
            ExpressionAttributeNames={
                '#status': 'status',
            },
            ExpressionAttributeValues={
                ':status': 'processed',
                ':processed': True,
            },
        )

        print(f"Webhook processed successfully: {webhook_id}")

        return {
            'statusCode': 200,
            'message': 'Webhook processed successfully',
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        raise e
