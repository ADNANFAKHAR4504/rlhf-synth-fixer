"""Payment processor Lambda function"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """Process payment webhooks from SQS"""
    try:
        for record in event.get('Records', []):
            # Parse SQS message
            webhook_data = json.loads(record.get('body', '{}'))
            webhook_id = webhook_data.get('webhookId')
            timestamp = webhook_data.get('timestamp')

            if not webhook_id or not timestamp:
                print(f"Skipping invalid record: {webhook_data}")
                continue

            # Simulate payment processing
            process_payment(webhook_id, webhook_data.get('provider'))

            # Update DynamoDB with processed status
            table.update_item(
                Key={
                    'webhookId': webhook_id,
                    'timestamp': timestamp,
                },
                UpdateExpression='SET #status = :status, processedAt = :processed',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'processed',
                    ':processed': datetime.utcnow().isoformat(),
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing complete'})
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        raise  # Re-raise to trigger DLQ


def process_payment(webhook_id, provider):
    """Process individual payment"""
    print(f"Processing payment for webhook: {webhook_id} from provider: {provider}")

    # Simulate payment processing logic
    # In real implementation, this would:
    # 1. Validate webhook signature
    # 2. Call payment provider API
    # 3. Update internal payment records
    # 4. Trigger downstream notifications

    # For now, just log the processing
    print(f"Payment processed successfully for {webhook_id}")
