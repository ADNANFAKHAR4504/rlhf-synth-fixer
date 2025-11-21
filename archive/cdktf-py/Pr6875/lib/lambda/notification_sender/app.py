"""Notification sender Lambda function."""

import json
import os
import boto3
from datetime import datetime

sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
STATUS_TABLE = os.environ['STATUS_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']


def update_status_table(file_id: str, status: str, message: str = ""):
    """Update processing status in DynamoDB."""
    table = dynamodb.Table(STATUS_TABLE)
    timestamp = int(datetime.utcnow().timestamp())

    table.put_item(
        Item={
            'file_id': file_id,
            'status': status,
            'timestamp': timestamp,
            'message': message,
            'updated_at': datetime.utcnow().isoformat()
        }
    )


def send_notification(file_id: str, records_processed: int, status: str):
    """Send notification to SNS topic."""
    message = {
        'file_id': file_id,
        'records_processed': records_processed,
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT
    }

    sns_client.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=f"Transaction Processing Complete - {file_id}",
        Message=json.dumps(message, indent=2)
    )


def handler(event, context):
    """
    Lambda handler for sending notifications.

    Sends processing results to SNS topic.
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Extract data from Step Functions output
        file_id = event.get('file_id', 'unknown')
        records_processed = event.get('records_processed', 0)
        status = event.get('status', 'completed')

        # Update status: notifying
        update_status_table(file_id, 'notifying')

        # Send notification
        send_notification(file_id, records_processed, status)

        # Update status: completed
        update_status_table(
            file_id,
            'completed',
            f"Notification sent for {records_processed} records"
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'notification_sent': True,
            'status': 'completed'
        }

    except Exception as e:
        print(f"Error: {str(e)}")

        if 'file_id' in event:
            update_status_table(event['file_id'], 'notification_failed', str(e))

        raise e
