"""Payment notifier Lambda function."""
import json

def lambda_handler(event, context):
    """Send payment notification."""
    try:
        for record in event['Records']:
            # Parse SQS message
            message = json.loads(record['body'])
            transaction_id = message['transaction_id']

            # In a real system, this would send an email/SMS/webhook
            print(f"Notification sent for transaction {transaction_id}")

        return {'statusCode': 200}
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise
