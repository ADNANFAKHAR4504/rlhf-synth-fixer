import json
import os
import boto3
from datetime import datetime

# Initialize SNS client
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Send alerts for messages from DLQ"""

    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    notifications_sent = 0

    for record in event['Records']:
        try:
            # Parse DLQ message
            message_body = record['body']

            # Try to parse as JSON
            try:
                message_data = json.loads(message_body)
            except json.JSONDecodeError:
                message_data = {'raw_message': message_body}

            # Prepare alert message
            alert = {
                'alert_type': 'DLQ_MESSAGE',
                'timestamp': datetime.utcnow().isoformat(),
                'message': message_data,
                'receipt_handle': record.get('receiptHandle'),
                'approximate_receive_count': record.get('attributes', {}).get('ApproximateReceiveCount', 'unknown')
            }

            # Send notification to SNS
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject='ALERT: Payment Processing DLQ Message',
                Message=json.dumps(alert, indent=2)
            )

            notifications_sent += 1
            print(f"Sent alert for DLQ message: {record.get('messageId')}")

        except Exception as e:
            print(f"Error sending alert: {str(e)}")
            # Continue processing other records

    return {
        'statusCode': 200,
        'body': json.dumps({
            'notifications_sent': notifications_sent
        })
    }
