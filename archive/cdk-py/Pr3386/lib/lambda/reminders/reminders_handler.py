"""
Reminders Lambda Handler
Scheduled function to check for upcoming task due dates and send reminders via SNS.
"""

import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Attr


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')

# Environment variables
TASKS_TABLE = os.environ['TASKS_TABLE']
NOTIFICATIONS_TOPIC_ARN = os.environ['NOTIFICATIONS_TOPIC_ARN']

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
    Main Lambda handler for task reminders
    Triggered by EventBridge scheduled rule (hourly)

    Args:
        event: EventBridge scheduled event
        context: Lambda context object

    Returns:
        Response with number of reminders sent
    """
    try:
        print("Starting task reminders check...")

        # Get current time and 24 hours from now
        now = datetime.utcnow()
        reminder_window = now + timedelta(hours=24)

        # Scan for tasks due within the next 24 hours
        response = tasks_table.scan(
            FilterExpression=Attr('status').ne('COMPLETED') & Attr('status').ne('CANCELLED')
        )

        tasks_checked = 0
        reminders_sent = 0
        tasks_to_remind = []

        for task in response.get('Items', []):
            tasks_checked += 1

            # Skip tasks without due dates
            if 'dueDate' not in task or not task['dueDate']:
                continue

            try:
                # Parse due date
                due_date = datetime.fromisoformat(task['dueDate'].replace('Z', '+00:00'))

                # Check if task is due within reminder window
                if now <= due_date <= reminder_window:
                    tasks_to_remind.append(task)
                    send_reminder_notification(task, due_date)
                    reminders_sent += 1

            except ValueError as e:
                print(f"Invalid date format for task {task.get('taskId')}: {str(e)}")
                continue

        result = {
            'tasksChecked': tasks_checked,
            'remindersSent': reminders_sent,
            'timestamp': now.isoformat() + 'Z'
        }

        print(f"Reminders check complete: {json.dumps(result)}")

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error in reminders handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to process reminders', 'message': str(e)})
        }


def send_reminder_notification(task, due_date):
    """Send reminder notification for a task"""
    try:
        task_title = task.get('title', 'Unknown Task')
        task_id = task.get('taskId', 'unknown')
        assigned_to = task.get('assignedTo', 'Unknown')
        priority = task.get('priority', 'MEDIUM')

        # Calculate time until due
        now = datetime.utcnow()
        time_until_due = due_date - now
        hours_until_due = int(time_until_due.total_seconds() / 3600)

        subject = f"Task Reminder: {task_title} (Due in {hours_until_due}h)"
        message = f"""
TASK REMINDER

Task: {task_title}
Task ID: {task_id}
Priority: {priority}
Assigned To: {assigned_to}
Due Date: {due_date.isoformat()}
Time Until Due: {hours_until_due} hours

Description: {task.get('description', 'No description provided')}

Please complete this task before the due date.

Status: {task.get('status', 'TODO')}
Project: {task.get('projectId', 'Unknown')}

---
This is an automated reminder from the Task Management System.
        """.strip()

        # Send SNS notification
        response = sns_client.publish(
            TopicArn=NOTIFICATIONS_TOPIC_ARN,
            Subject=subject,
            Message=message,
            MessageAttributes={
                'notification_type': {
                    'DataType': 'String',
                    'StringValue': 'task_reminder'
                },
                'task_id': {
                    'DataType': 'String',
                    'StringValue': task_id
                },
                'priority': {
                    'DataType': 'String',
                    'StringValue': priority
                }
            }
        )

        print(f"Reminder sent for task {task_id}: {task_title}")
        return response

    except Exception as e:
        print(f"Error sending reminder for task {task.get('taskId', 'unknown')}: {str(e)}")
        raise


def check_overdue_tasks():
    """Check for overdue tasks and send alerts"""
    try:
        now = datetime.utcnow()

        # Scan for overdue tasks
        response = tasks_table.scan(
            FilterExpression=Attr('status').ne('COMPLETED') & Attr('status').ne('CANCELLED')
        )

        overdue_count = 0

        for task in response.get('Items', []):
            if 'dueDate' not in task or not task['dueDate']:
                continue

            try:
                due_date = datetime.fromisoformat(task['dueDate'].replace('Z', '+00:00'))

                # Check if task is overdue
                if due_date < now:
                    send_overdue_notification(task, due_date, now)
                    overdue_count += 1

            except ValueError:
                continue

        return overdue_count

    except Exception as e:
        print(f"Error checking overdue tasks: {str(e)}")
        return 0


def send_overdue_notification(task, due_date, now):
    """Send notification for overdue task"""
    try:
        task_title = task.get('title', 'Unknown Task')
        time_overdue = now - due_date
        days_overdue = int(time_overdue.total_seconds() / 86400)

        subject = f"OVERDUE TASK: {task_title} ({days_overdue} days overdue)"
        message = f"""
⚠️ OVERDUE TASK ALERT ⚠️

Task: {task_title}
Task ID: {task.get('taskId', 'unknown')}
Priority: {task.get('priority', 'MEDIUM')}
Assigned To: {task.get('assignedTo', 'Unknown')}
Due Date: {due_date.isoformat()}
Days Overdue: {days_overdue}

This task requires immediate attention!

---
This is an automated alert from the Task Management System.
        """.strip()

        sns_client.publish(
            TopicArn=NOTIFICATIONS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

    except Exception as e:
        print(f"Error sending overdue notification: {str(e)}")
