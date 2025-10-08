import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
events = boto3.client('events')

table_name = os.environ['TABLE_NAME']
topic_arn = os.environ['TOPIC_ARN']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        # Get appointment details
        appointment_id = event['appointmentId']
        user_id = event['userId']
        reminder_type = event['reminderType']

        # Fetch appointment from DynamoDB
        response = table.get_item(
            Key={'appointmentId': appointment_id}
        )

        if 'Item' not in response:
            print(f"Appointment {appointment_id} not found")
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Appointment not found'})
            }

        appointment = response['Item']

        # Check if appointment is still scheduled
        if appointment.get('status') != 'scheduled':
            print(f"Appointment {appointment_id} is not in scheduled status")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Appointment not active'})
            }

        # Send notification
        message = format_reminder_message(appointment, reminder_type)

        sns.publish(
            TopicArn=topic_arn,
            Subject=f"Appointment Reminder - {reminder_type.replace('_', ' ').title()}",
            Message=message,
            MessageAttributes={
                'userId': {'DataType': 'String', 'StringValue': user_id},
                'appointmentId': {'DataType': 'String', 'StringValue': appointment_id},
                'reminderType': {'DataType': 'String', 'StringValue': reminder_type}
            }
        )

        # Log metric
        cloudwatch.put_metric_data(
            Namespace='AppointmentScheduler',
            MetricData=[
                {
                    'MetricName': 'RemindersSent',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'ReminderType',
                            'Value': reminder_type
                        }
                    ]
                }
            ]
        )

        # Clean up EventBridge rule after execution
        cleanup_rule(appointment_id, reminder_type)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Reminder sent successfully',
                'appointmentId': appointment_id,
                'reminderType': reminder_type
            })
        }

    except Exception as e:
        print(f"Error sending reminder: {str(e)}")

        cloudwatch.put_metric_data(
            Namespace='AppointmentScheduler',
            MetricData=[
                {
                    'MetricName': 'ReminderErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def format_reminder_message(appointment, reminder_type):
    start_time = appointment['startTime']
    details = appointment.get('details', {})

    if reminder_type == '24_hour':
        message = f"Reminder: You have an appointment scheduled for tomorrow at {start_time}."
    else:  # 1_hour
        message = f"Reminder: Your appointment is in 1 hour at {start_time}."

    if details.get('location'):
        message += f"\nLocation: {details['location']}"

    if details.get('description'):
        message += f"\nDescription: {details['description']}"

    message += "\n\nPlease ensure you arrive on time."

    return message

def cleanup_rule(appointment_id, reminder_type):
    try:
        if reminder_type == '24_hour':
            rule_name = f"appointment-reminder-24h-{appointment_id}"
        else:
            rule_name = f"appointment-reminder-1h-{appointment_id}"

        # Remove targets first
        events.remove_targets(Rule=rule_name, Ids=['1'])

        # Then delete the rule
        events.delete_rule(Name=rule_name)

        print(f"Cleaned up EventBridge rule: {rule_name}")

    except Exception as e:
        print(f"Error cleaning up rule: {str(e)}")