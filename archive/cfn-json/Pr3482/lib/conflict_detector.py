import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
cloudwatch = boto3.client('cloudwatch')

table_name = os.environ['TABLE_NAME']
reminder_function_arn = os.environ['REMINDER_FUNCTION_ARN']
table = dynamodb.Table(table_name)

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event, context):
    try:
        body = json.loads(event['body'])
        user_id = body['userId']
        start_time = body['startTime']
        end_time = body['endTime']
        appointment_details = body.get('details', {})

        # Check for conflicts
        conflict = check_conflicts(user_id, start_time, end_time)

        if conflict:
            # Log metric for failed booking
            cloudwatch.put_metric_data(
                Namespace='AppointmentScheduler',
                MetricData=[
                    {
                        'MetricName': 'BookingConflicts',
                        'Value': 1,
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 409,
                'body': json.dumps({
                    'error': 'Appointment conflict detected',
                    'conflictingAppointment': conflict
                })
            }

        # Create appointment with conditional write
        appointment_id = str(uuid.uuid4())
        appointment = create_appointment(
            appointment_id, user_id, start_time, end_time, appointment_details
        )

        if appointment:
            # Schedule reminders
            schedule_reminders(appointment_id, start_time, user_id)

            # Log metric for successful booking
            cloudwatch.put_metric_data(
                Namespace='AppointmentScheduler',
                MetricData=[
                    {
                        'MetricName': 'BookingSuccess',
                        'Value': 1,
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 201,
                'body': json.dumps({
                    'appointmentId': appointment_id,
                    'message': 'Appointment scheduled successfully'
                }, default=decimal_default)
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to create appointment'})
            }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='AppointmentScheduler',
            MetricData=[
                {
                    'MetricName': 'BookingErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def check_conflicts(user_id, start_time, end_time):
    try:
        # Query existing appointments for the user
        response = table.query(
            IndexName='UserAppointmentsIndex',
            KeyConditionExpression=Key('userId').eq(user_id) &
                                   Key('startTime').between(start_time, end_time)
        )

        if response['Items']:
            return response['Items'][0]

        # Also check if any appointment ends during this time
        earlier_start = (datetime.fromisoformat(start_time) - timedelta(hours=4)).isoformat()
        response = table.query(
            IndexName='UserAppointmentsIndex',
            KeyConditionExpression=Key('userId').eq(user_id) &
                                   Key('startTime').between(earlier_start, start_time)
        )

        for item in response['Items']:
            if item['endTime'] > start_time:
                return item

        return None

    except Exception as e:
        print(f"Error checking conflicts: {str(e)}")
        return None

def create_appointment(appointment_id, user_id, start_time, end_time, details):
    try:
        item = {
            'appointmentId': appointment_id,
            'userId': user_id,
            'startTime': start_time,
            'endTime': end_time,
            'details': details,
            'createdAt': datetime.utcnow().isoformat(),
            'status': 'scheduled'
        }

        # Conditional write to prevent duplicate appointments
        table.put_item(
            Item=item,
            ConditionExpression=Attr('appointmentId').not_exists()
        )

        return item

    except Exception as e:
        print(f"Error creating appointment: {str(e)}")
        return None

def schedule_reminders(appointment_id, start_time, user_id):
    try:
        appointment_dt = datetime.fromisoformat(start_time)

        # Schedule 24-hour reminder
        reminder_24h = appointment_dt - timedelta(hours=24)
        if reminder_24h > datetime.utcnow():
            create_eventbridge_rule(
                f"appointment-reminder-24h-{appointment_id}",
                reminder_24h,
                appointment_id,
                user_id,
                "24_hour"
            )

        # Schedule 1-hour reminder
        reminder_1h = appointment_dt - timedelta(hours=1)
        if reminder_1h > datetime.utcnow():
            create_eventbridge_rule(
                f"appointment-reminder-1h-{appointment_id}",
                reminder_1h,
                appointment_id,
                user_id,
                "1_hour"
            )

    except Exception as e:
        print(f"Error scheduling reminders: {str(e)}")

def create_eventbridge_rule(rule_name, trigger_time, appointment_id, user_id, reminder_type):
    try:
        # Create the rule
        events.put_rule(
            Name=rule_name,
            ScheduleExpression=f"at({trigger_time.strftime('%Y-%m-%dT%H:%M:%S')})",
            State='ENABLED',
            Description=f"Reminder for appointment {appointment_id}"
        )

        # Add Lambda target
        events.put_targets(
            Rule=rule_name,
            Targets=[
                {
                    'Id': '1',
                    'Arn': reminder_function_arn,
                    'Input': json.dumps({
                        'appointmentId': appointment_id,
                        'userId': user_id,
                        'reminderType': reminder_type
                    })
                }
            ]
        )

    except Exception as e:
        print(f"Error creating EventBridge rule: {str(e)}")