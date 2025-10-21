import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')
dynamodb = boto3.client('dynamodb')

SNS_CRITICAL = os.environ['SNS_CRITICAL_TOPIC']
SNS_HIGH = os.environ['SNS_HIGH_TOPIC']
SNS_MEDIUM = os.environ['SNS_MEDIUM_TOPIC']
FINDINGS_TABLE = os.environ['FINDINGS_TABLE']


def lambda_handler(event, context):
    """
    Enrich EventBridge alerts with context and route to appropriate SNS topic
    """
    try:
        detail = event.get('detail', {})
        event_name = detail.get('eventName', '')
        user_identity = detail.get('userIdentity', {})

        # Determine severity
        severity = determine_severity(event_name, detail)

        # Enrich with context
        enriched_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'severity': severity,
            'eventName': event_name,
            'userType': user_identity.get('type', ''),
            'principalId': user_identity.get('principalId', ''),
            'accountId': detail.get('recipientAccountId', ''),
            'region': detail.get('awsRegion', ''),
            'sourceIP': detail.get('sourceIPAddress', ''),
            'userAgent': detail.get('userAgent', ''),
            'details': detail
        }

        # Send to appropriate SNS topic
        topic_arn = get_topic_by_severity(severity)

        sns.publish(
            TopicArn=topic_arn,
            Subject=f"[{severity.upper()}] {event_name}",
            Message=json.dumps(enriched_message, indent=2, default=str)
        )

        return {'statusCode': 200, 'severity': severity}

    except Exception as e:
        print(f"Error enriching alert: {str(e)}")
        raise


def determine_severity(event_name, detail):
    """
    Determine alert severity based on event
    """
    if detail.get('userIdentity', {}).get('type') == 'Root':
        return 'critical'

    high_risk_events = ['DeleteUser', 'AttachUserPolicy', 'PutBucketPolicy', 'ScheduleKeyDeletion']
    if any(risk in event_name for risk in high_risk_events):
        return 'high'

    return 'medium'


def get_topic_by_severity(severity):
    """
    Map severity to SNS topic ARN
    """
    mapping = {
        'critical': SNS_CRITICAL,
        'high': SNS_HIGH,
        'medium': SNS_MEDIUM
    }
    return mapping.get(severity, SNS_MEDIUM)
