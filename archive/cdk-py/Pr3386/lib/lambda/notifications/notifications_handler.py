"""
Notifications Lambda Handler
Handles sending notifications via SNS for task-related events.
"""

import json
import os
from decimal import Decimal
import boto3


# Initialize AWS clients
sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

# Environment variables
NOTIFICATIONS_TOPIC_ARN = os.environ['NOTIFICATIONS_TOPIC_ARN']
TASKS_TABLE = os.environ['TASKS_TABLE']

# DynamoDB table
tasks_table = dynamodb.Table(TASKS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to int/float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Main Lambda handler for sending notifications

    Args:
        event: Event data (can be from API Gateway, EventBridge, or direct invocation)
        context: Lambda context object

    Returns:
        Response with status and message
    """
    try:
        # Check if this is an API Gateway event
        if 'httpMethod' in event:
            body = json.loads(event.get('body', '{}')) if event.get('body') else {}
            notification_type = body.get('type', 'general')
            message = body.get('message', '')
            subject = body.get('subject', 'Task Management Notification')

            # Send notification
            response = send_sns_notification(subject, message)

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'message': 'Notification sent successfully',
                    'messageId': response['MessageId']
                })
            }

        # Handle DynamoDB Stream events
        elif 'Records' in event:
            for record in event['Records']:
                if record['eventName'] == 'INSERT':
                    # New task created
                    new_task = record['dynamodb']['NewImage']
                    send_task_created_notification(new_task)
                elif record['eventName'] == 'MODIFY':
                    # Task updated
                    new_task = record['dynamodb']['NewImage']
                    old_task = record['dynamodb']['OldImage']
                    send_task_updated_notification(new_task, old_task)

            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Stream events processed'})
            }

        # Handle direct invocation
        else:
            notification_type = event.get('type', 'general')
            message = event.get('message', '')
            subject = event.get('subject', 'Task Management Notification')

            response = send_sns_notification(subject, message)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Notification sent successfully',
                    'messageId': response['MessageId']
                })
            }

    except Exception as e:
        print(f"Error in notifications handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to send notification', 'message': str(e)})
        }


def send_sns_notification(subject, message):
    """Send notification via SNS"""
    try:
        response = sns_client.publish(
            TopicArn=NOTIFICATIONS_TOPIC_ARN,
            Subject=subject,
            Message=message,
            MessageAttributes={
                'notification_type': {
                    'DataType': 'String',
                    'StringValue': 'task_management'
                }
            }
        )
        print(f"SNS notification sent: {subject}")
        return response

    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")
        raise


def send_task_created_notification(task):
    """Send notification for newly created task"""
    try:
        task_title = task.get('title', {}).get('S', 'Unknown')
        assigned_to = task.get('assignedTo', {}).get('S', 'Unknown')

        subject = f"New Task Assigned: {task_title}"
        message = f"""
A new task has been created and assigned to you.

Task: {task_title}
Assigned To: {assigned_to}
Status: {task.get('status', {}).get('S', 'TODO')}
Priority: {task.get('priority', {}).get('S', 'MEDIUM')}

Please check the task management system for more details.
        """.strip()

        send_sns_notification(subject, message)

    except Exception as e:
        print(f"Error sending task created notification: {str(e)}")


def send_task_updated_notification(new_task, old_task):
    """Send notification for task updates"""
    try:
        task_title = new_task.get('title', {}).get('S', 'Unknown')
        old_status = old_task.get('status', {}).get('S', '')
        new_status = new_task.get('status', {}).get('S', '')

        # Only send notification if status changed
        if old_status != new_status:
            subject = f"Task Status Updated: {task_title}"
            message = f"""
A task status has been updated.

Task: {task_title}
Previous Status: {old_status}
New Status: {new_status}

Please check the task management system for more details.
            """.strip()

            send_sns_notification(subject, message)

    except Exception as e:
        print(f"Error sending task updated notification: {str(e)}")
