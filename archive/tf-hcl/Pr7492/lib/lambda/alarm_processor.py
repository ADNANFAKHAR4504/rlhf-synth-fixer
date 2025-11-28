import json
import boto3
import os
import time
from typing import Dict, Any

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Process CloudWatch alarms with retry mechanism and exponential backoff.
    Routes notifications to appropriate SNS topics based on severity.
    """

    max_retries = int(os.environ.get('MAX_RETRY_ATTEMPTS', '5'))
    initial_delay = int(os.environ.get('INITIAL_RETRY_DELAY', '1000'))
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Parse alarm from SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message.get('AlarmName')
        alarm_state = message.get('NewStateValue')
        alarm_reason = message.get('NewStateReason')

        # Determine severity based on alarm name pattern
        severity = determine_severity(alarm_name)

        # Get appropriate SNS topic
        topic_arn = get_topic_for_severity(severity)

        # Publish with retry and exponential backoff
        publish_with_retry(
            topic_arn=topic_arn,
            message=format_alarm_message(message),
            subject=f"[{severity}] {alarm_name}",
            max_retries=max_retries,
            initial_delay=initial_delay
        )

        # Filter non-production during maintenance
        if should_suppress_alarm(alarm_name, environment):
            print(f"Suppressing alarm {alarm_name} for environment {environment}")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Alarm suppressed'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'alarm': alarm_name,
                'severity': severity,
                'state': alarm_state
            })
        }

    except Exception as e:
        print(f"Error processing alarm: {str(e)}")
        raise

def determine_severity(alarm_name: str) -> str:
    """
    Determine alarm severity based on naming convention.
    """

    if 'critical' in alarm_name.lower():
        return 'CRITICAL'
    elif 'warning' in alarm_name.lower():
        return 'WARNING'
    else:
        return 'INFO'

def get_topic_for_severity(severity: str) -> str:
    """
    Get SNS topic ARN based on severity level.
    """

    severity_map = {
        'CRITICAL': os.environ.get('SNS_CRITICAL_ARN'),
        'WARNING': os.environ.get('SNS_WARNING_ARN'),
        'INFO': os.environ.get('SNS_INFO_ARN')
    }

    return severity_map.get(severity, os.environ.get('SNS_INFO_ARN'))

def publish_with_retry(topic_arn: str, message: str, subject: str,
                      max_retries: int, initial_delay: int) -> None:
    """
    Publish to SNS with exponential backoff retry mechanism.
    """

    attempt = 0
    delay = initial_delay

    while attempt < max_retries:
        try:
            sns.publish(
                TopicArn=topic_arn,
                Message=message,
                Subject=subject
            )
            print(f"Successfully published to SNS on attempt {attempt + 1}")
            return

        except Exception as e:
            attempt += 1
            if attempt >= max_retries:
                print(f"Failed to publish after {max_retries} attempts")
                raise

            print(f"Attempt {attempt} failed: {str(e)}. Retrying in {delay}ms...")
            time.sleep(delay / 1000.0)
            delay *= 2  # Exponential backoff

def format_alarm_message(alarm_data: Dict[str, Any]) -> str:
    """
    Format alarm data into human-readable message.
    """

    return json.dumps({
        'Alarm': alarm_data.get('AlarmName'),
        'State': alarm_data.get('NewStateValue'),
        'Reason': alarm_data.get('NewStateReason'),
        'Timestamp': alarm_data.get('StateChangeTime'),
        'Region': alarm_data.get('Region'),
        'AccountId': alarm_data.get('AWSAccountId')
    }, indent=2)

def should_suppress_alarm(alarm_name: str, environment: str) -> bool:
    """
    Determine if alarm should be suppressed during maintenance windows.
    Excludes non-production environments from alerting.
    """

    # Suppress non-prod alarms during maintenance (example logic)
    if environment != 'prod':
        # Check if within maintenance window (simplified)
        current_hour = time.gmtime().tm_hour
        # Maintenance window: 2 AM - 4 AM UTC
        if 2 <= current_hour < 4:
            return True

    return False
