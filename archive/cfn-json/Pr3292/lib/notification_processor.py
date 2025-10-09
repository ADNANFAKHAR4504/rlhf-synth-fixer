import json
import boto3
import uuid
import time
from datetime import datetime
from botocore.exceptions import ClientError
from typing import Dict, List, Any
import os

# Initialize AWS clients
sns_client = boto3.client('sns', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
ses_client = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
cloudwatch = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-west-1'))

# Get environment variables
TABLE_NAME = os.environ.get('NOTIFICATION_TABLE', 'notification-delivery-logs')
EMAIL_DOMAIN = os.environ.get('EMAIL_DOMAIN', 'example.com')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing appointment notifications.

    Args:
        event: Event containing list of appointments to process
        context: Lambda context object

    Returns:
        Response with processing results
    """
    batch_id = str(uuid.uuid4())
    results = {'success': 0, 'failed': 0, 'fallback': 0}

    # Extract appointments from event
    appointments = event.get('appointments', [])

    if not appointments:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No appointments provided'})
        }

    # Process appointments in batches for efficiency
    batch_size = 50
    for i in range(0, len(appointments), batch_size):
        batch = appointments[i:i + batch_size]
        process_batch(batch, batch_id, results)

    # Publish metrics to CloudWatch
    publish_metrics(results)

    # Calculate success rate
    total_processed = results['success'] + results['failed'] + results['fallback']
    success_rate = ((results['success'] + results['fallback']) / total_processed * 100) if total_processed > 0 else 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'batchId': batch_id,
            'processed': len(appointments),
            'results': results,
            'successRate': f"{success_rate:.2f}%"
        })
    }

def process_batch(appointments: List[Dict[str, Any]], batch_id: str, results: Dict[str, int]) -> None:
    """
    Process a batch of appointments.

    Args:
        appointments: List of appointment dictionaries
        batch_id: Unique identifier for this batch
        results: Dictionary to track results
    """
    for appointment in appointments:
        notification_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)

        try:
            send_notification(appointment, notification_id, timestamp, results)
        except Exception as e:
            print(f"Error processing appointment {appointment.get('patientId')}: {str(e)}")
            results['failed'] += 1
            log_notification(notification_id, timestamp, appointment, 'FAILED', str(e), batch_id)

def send_notification(appointment: Dict[str, Any], notification_id: str,
                     timestamp: int, results: Dict[str, int]) -> None:
    """
    Send notification via SMS with email fallback.

    Args:
        appointment: Appointment details
        notification_id: Unique notification identifier
        timestamp: Current timestamp
        results: Results tracker
    """
    patient_id = appointment.get('patientId')
    phone_number = appointment.get('phoneNumber')
    email = appointment.get('email')
    appointment_time = appointment.get('appointmentTime')
    doctor_name = appointment.get('doctorName')

    # Validate required fields
    if not patient_id or not appointment_time:
        raise ValueError("Missing required appointment fields")

    message = format_notification_message(appointment)

    # Try SMS first
    sms_sent = False
    if phone_number and validate_phone_number(phone_number):
        sms_sent = send_sms(phone_number, message, notification_id, timestamp,
                           appointment, results)

    # Fallback to email if SMS fails or unavailable
    if not sms_sent and email and validate_email(email):
        send_email_notification(email, message, notification_id, timestamp,
                              appointment, results)
    elif not sms_sent and not email:
        # No valid contact method available
        log_notification(notification_id, timestamp, appointment,
                        'NO_CONTACT', 'No valid phone or email', '')
        results['failed'] += 1

def send_sms(phone_number: str, message: str, notification_id: str,
            timestamp: int, appointment: Dict[str, Any],
            results: Dict[str, int]) -> bool:
    """
    Send SMS notification using SNS.

    Args:
        phone_number: Recipient phone number
        message: Message content
        notification_id: Notification ID
        timestamp: Timestamp
        appointment: Appointment details
        results: Results tracker

    Returns:
        True if SMS sent successfully, False otherwise
    """
    try:
        # Add retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = sns_client.publish(
                    PhoneNumber=phone_number,
                    Message=message,
                    MessageAttributes={
                        'AWS.SNS.SMS.SMSType': {
                            'DataType': 'String',
                            'StringValue': 'Transactional'
                        },
                        'AWS.SNS.SMS.MaxPrice': {
                            'DataType': 'Number',
                            'StringValue': '0.50'
                        }
                    }
                )

                log_notification(notification_id, timestamp, appointment,
                               'SMS_SENT', response['MessageId'], '')
                results['success'] += 1
                return True

            except ClientError as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    raise e

    except ClientError as e:
        error_code = e.response['Error']['Code']
        print(f"SMS send failed for {appointment.get('patientId')}: {error_code} - {str(e)}")
        return False

    return False

def send_email_notification(email: str, message: str, notification_id: str,
                           timestamp: int, appointment: Dict[str, Any],
                           results: Dict[str, int]) -> None:
    """
    Send email notification using SES as fallback.

    Args:
        email: Recipient email address
        message: Message content
        notification_id: Notification ID
        timestamp: Timestamp
        appointment: Appointment details
        results: Results tracker
    """
    try:
        response = ses_client.send_email(
            Source=f'noreply@{EMAIL_DOMAIN}',
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {
                    'Data': 'Appointment Reminder',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': message,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': format_html_email(appointment, message),
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        log_notification(notification_id, timestamp, appointment,
                       'EMAIL_SENT', response['MessageId'], '')
        results['fallback'] += 1

    except ClientError as e:
        print(f"Email send failed for {appointment.get('patientId')}: {str(e)}")
        log_notification(notification_id, timestamp, appointment,
                       'ALL_FAILED', str(e), '')
        results['failed'] += 1

def log_notification(notification_id: str, timestamp: int,
                    appointment: Dict[str, Any], status: str,
                    message_id: str, batch_id: str) -> None:
    """
    Log notification attempt to DynamoDB.

    Args:
        notification_id: Unique notification ID
        timestamp: Timestamp of attempt
        appointment: Appointment details
        status: Delivery status
        message_id: AWS message ID if successful
        batch_id: Batch identifier
    """
    try:
        table.put_item(
            Item={
                'notificationId': notification_id,
                'timestamp': timestamp,
                'patientId': appointment.get('patientId', 'unknown'),
                'status': status,
                'messageId': message_id,
                'batchId': batch_id,
                'appointmentTime': appointment.get('appointmentTime', ''),
                'doctorName': appointment.get('doctorName', ''),
                'phoneNumber': appointment.get('phoneNumber', ''),
                'email': appointment.get('email', ''),
                'createdAt': datetime.utcnow().isoformat(),
                'ttl': int(time.time()) + (90 * 24 * 3600)  # 90 days TTL
            }
        )
    except Exception as e:
        print(f"Failed to log notification: {str(e)}")

def publish_metrics(results: Dict[str, int]) -> None:
    """
    Publish custom metrics to CloudWatch.

    Args:
        results: Dictionary containing success/failure counts
    """
    try:
        total = sum(results.values())
        success_rate = ((results['success'] + results['fallback']) / total * 100) if total > 0 else 0

        cloudwatch.put_metric_data(
            Namespace='HealthcareNotifications',
            MetricData=[
                {
                    'MetricName': 'SuccessfulNotifications',
                    'Value': results['success'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FailedNotifications',
                    'Value': results['failed'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FallbackNotifications',
                    'Value': results['fallback'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'DeliverySuccessRate',
                    'Value': success_rate,
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Failed to publish metrics: {str(e)}")

def format_notification_message(appointment: Dict[str, Any]) -> str:
    """
    Format the notification message.

    Args:
        appointment: Appointment details

    Returns:
        Formatted message string
    """
    doctor_name = appointment.get('doctorName', 'your doctor')
    appointment_time = appointment.get('appointmentTime', 'soon')
    location = appointment.get('location', '')

    message = f"Reminder: Your appointment with Dr. {doctor_name} is scheduled for {appointment_time}."

    if location:
        message += f" Location: {location}."

    message += " Reply CONFIRM to confirm or CANCEL to cancel."

    return message

def format_html_email(appointment: Dict[str, Any], text_message: str) -> str:
    """
    Format HTML email content.

    Args:
        appointment: Appointment details
        text_message: Plain text message

    Returns:
        HTML formatted email
    """
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Appointment Reminder</h2>
            <p style="font-size: 16px; color: #555;">{text_message}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 14px; color: #777;">
                Patient ID: {appointment.get('patientId', 'N/A')}<br>
                Appointment ID: {appointment.get('appointmentId', 'N/A')}
            </p>
            <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </p>
        </body>
    </html>
    """

def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format.

    Args:
        phone: Phone number string

    Returns:
        True if valid, False otherwise
    """
    if not phone:
        return False

    # Remove common formatting characters
    cleaned = ''.join(filter(str.isdigit, phone))

    # Check for valid US phone number (10 or 11 digits)
    return len(cleaned) in [10, 11] and (len(cleaned) != 11 or cleaned[0] == '1')

def validate_email(email: str) -> bool:
    """
    Basic email validation.

    Args:
        email: Email address string

    Returns:
        True if valid, False otherwise
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))