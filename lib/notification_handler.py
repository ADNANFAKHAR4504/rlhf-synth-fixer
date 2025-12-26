import json
import boto3
import os
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any

# Initialize AWS clients
sns = boto3.client('sns', region_name='us-west-1')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
ses = boto3.client('ses', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

# Get environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'sms-delivery-logs-dev')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@healthcare.example.com')
TOPIC_ARN = os.environ.get('TOPIC_ARN', '')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing appointment notifications.

    Args:
        event: Contains list of appointments to process
        context: Lambda context object

    Returns:
        Response with status code and processing results
    """
    print(f"Processing batch of {len(event.get('appointments', []))} appointments")

    results = {
        'successful': 0,
        'failed': 0,
        'fallback': 0,
        'errors': []
    }

    # Validate input
    if 'appointments' not in event:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No appointments provided'})
        }

    appointments = event['appointments']

    # Process each appointment
    for appointment in appointments:
        try:
            if validate_appointment(appointment):
                success = send_notification(appointment)
                if success:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
            else:
                results['errors'].append(f"Invalid appointment data: {appointment.get('patient_id', 'unknown')}")
        except Exception as e:
            print(f"Error processing appointment: {str(e)}")
            results['errors'].append(str(e))
            results['failed'] += 1

    # Send metrics to CloudWatch
    send_metrics(results)

    # Log summary
    print(f"Processing complete: {results}")

    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }

def validate_appointment(appointment: Dict[str, Any]) -> bool:
    """
    Validate appointment data has required fields.

    Args:
        appointment: Appointment dictionary

    Returns:
        Boolean indicating if appointment is valid
    """
    required_fields = ['patient_id', 'phone_number', 'message']
    for field in required_fields:
        if field not in appointment or not appointment[field]:
            print(f"Missing required field: {field}")
            return False

    # Validate phone number format (basic check)
    phone = appointment['phone_number']
    if not phone.startswith('+') or len(phone) < 10:
        print(f"Invalid phone number format: {phone}")
        return False

    return True

def send_notification(appointment: Dict[str, Any]) -> bool:
    """
    Send SMS notification with retry logic and email fallback.

    Args:
        appointment: Appointment details

    Returns:
        Boolean indicating success
    """
    patient_id = appointment['patient_id']
    phone = appointment['phone_number']
    message = appointment['message']

    # Try sending SMS up to 3 times
    for attempt in range(3):
        try:
            # Configure SMS attributes for AWS End User Messaging
            sms_attributes = {
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                },
                'AWS.SNS.SMS.MaxPrice': {
                    'DataType': 'Number',
                    'StringValue': '0.50'
                }
            }

            # Send SMS via SNS
            response = sns.publish(
                PhoneNumber=phone,
                Message=message,
                MessageAttributes=sms_attributes
            )

            # Log successful delivery
            message_id = response.get('MessageId', 'unknown')
            log_delivery(
                patient_id=patient_id,
                phone=phone,
                message=message,
                status='SUCCESS',
                retry_count=attempt + 1,
                message_id=message_id
            )

            print(f"SMS sent successfully to {phone} (MessageId: {message_id})")
            return True

        except Exception as e:
            print(f"SMS attempt {attempt + 1} failed for {phone}: {str(e)}")

            # If this is the final attempt, try email fallback
            if attempt == 2:
                if 'email' in appointment and appointment['email']:
                    fallback_success = send_email_fallback(appointment)
                    status = 'FAILED_WITH_EMAIL_FALLBACK' if fallback_success else 'FAILED'
                else:
                    status = 'FAILED_NO_FALLBACK'

                log_delivery(
                    patient_id=patient_id,
                    phone=phone,
                    message=message,
                    status=status,
                    retry_count=attempt + 1,
                    error=str(e)
                )
                return False

            # Exponential backoff before retry
            time.sleep(2 ** attempt)

    return False

def send_email_fallback(appointment: Dict[str, Any]) -> bool:
    """
    Send email as fallback when SMS fails.

    Args:
        appointment: Appointment details including email

    Returns:
        Boolean indicating success
    """
    try:
        email = appointment.get('email', '')
        if not email:
            print("No email address provided for fallback")
            return False

        # Send email using SES
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                'ToAddresses': [email]
            },
            Message={
                'Subject': {
                    'Data': 'Appointment Reminder',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': appointment['message'],
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': f"<html><body><p>{appointment['message']}</p></body></html>",
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        print(f"Email fallback sent to {email}")
        return True

    except Exception as e:
        print(f"Email fallback failed: {str(e)}")
        return False

def log_delivery(patient_id: str, phone: str, message: str, status: str,
                 retry_count: int, *, message_id: str = None, error: str = None):
    """
    Log delivery attempt to DynamoDB.

    Args:
        patient_id: Patient identifier
        phone: Phone number
        message: Message content
        status: Delivery status
        retry_count: Number of attempts
        message_id: SNS message ID if successful
        error: Error message if failed
    """
    timestamp = int(datetime.now().timestamp())
    ttl = int((datetime.now() + timedelta(days=90)).timestamp())

    item = {
        'patientId': patient_id,
        'timestamp': timestamp,
        'phoneNumber': phone,
        'messageContent': message[:500],  # Truncate long messages
        'deliveryStatus': status,
        'retryCount': retry_count,
        'ttl': ttl,
        'createdAt': datetime.now().isoformat()
    }

    if message_id:
        item['messageId'] = message_id
    if error:
        item['errorMessage'] = error[:500]  # Truncate long errors

    try:
        table.put_item(Item=item)
        print(f"Logged delivery: {status} for patient {patient_id}")
    except Exception as e:
        print(f"Failed to log delivery: {str(e)}")

def send_metrics(results: Dict[str, int]):
    """
    Send metrics to CloudWatch for monitoring.

    Args:
        results: Dictionary with success/failure counts
    """
    try:
        # Calculate failure rate
        total = results['successful'] + results['failed']
        failure_rate = (results['failed'] / total * 100) if total > 0 else 0

        # Send metrics to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='AppointmentReminders',
            MetricData=[
                {
                    'MetricName': 'SuccessfulSMS',
                    'Value': results['successful'],
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'FailedSMS',
                    'Value': results['failed'],
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'FailureRate',
                    'Value': failure_rate,
                    'Unit': 'Percent',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'EmailFallbacks',
                    'Value': results.get('fallback', 0),
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                }
            ]
        )
        print(f"Metrics sent to CloudWatch: {results}")
    except Exception as e:
        print(f"Failed to send metrics: {str(e)}")
