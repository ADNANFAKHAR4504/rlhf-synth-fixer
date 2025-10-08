import json
import boto3
import os
from datetime import datetime

sns = boto3.client('sns')
logs = boto3.client('logs')

def handler(event, context):
    """
    Process security findings and add custom tags based on patterns
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Parse the incoming security event
        if 'detail' in event:
            detail = event['detail']

            # Extract finding details
            findings = detail.get('findings', [detail])

            for finding in findings:
                # Add custom tags based on event patterns
                custom_tags = analyze_finding(finding)

                # Enrich the finding with custom tags
                enriched_finding = {
                    **finding,
                    'CustomTags': custom_tags,
                    'ProcessedAt': datetime.utcnow().isoformat()
                }

                # Log enriched finding
                log_finding(enriched_finding)

                # Send critical findings to SNS
                if is_critical(finding):
                    notify_security_team(enriched_finding)

        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed security finding')
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def analyze_finding(finding):
    """
    Analyze finding and return custom tags
    """
    tags = []

    # Check for specific patterns
    title = finding.get('Title', '').lower()
    description = finding.get('Description', '').lower()

    if 'root' in title or 'root' in description:
        tags.append('ROOT_ACTIVITY')

    if 'public' in title or 'exposed' in description:
        tags.append('PUBLIC_EXPOSURE')

    if 'cryptocurrency' in description or 'mining' in description:
        tags.append('CRYPTO_MINING')

    if 'malware' in title or 'malware' in description:
        tags.append('MALWARE_DETECTED')

    if 'unauthorized' in title or 'suspicious' in description:
        tags.append('SUSPICIOUS_ACTIVITY')

    # Add severity-based tags
    severity = finding.get('Severity', {})
    if isinstance(severity, dict):
        label = severity.get('Label', '')
    else:
        label = str(severity)

    if label in ['CRITICAL', 'HIGH']:
        tags.append('IMMEDIATE_ACTION')

    return tags

def is_critical(finding):
    """
    Determine if finding requires immediate notification
    """
    severity = finding.get('Severity', {})
    if isinstance(severity, dict):
        label = severity.get('Label', '')
        normalized = severity.get('Normalized', 0)
    else:
        label = str(severity)
        normalized = 0

    return label in ['CRITICAL', 'HIGH'] or normalized >= 70

def log_finding(finding):
    """
    Log enriched finding to CloudWatch
    """
    log_group = os.environ.get('LOG_GROUP', '/aws/security/events')

    try:
        logs.put_log_events(
            logGroupName=log_group,
            logStreamName='custom-rules-processor',
            logEvents=[
                {
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'message': json.dumps(finding)
                }
            ]
        )
    except Exception as e:
        print(f"Error logging to CloudWatch: {str(e)}")

def notify_security_team(finding):
    """
    Send notification to security team via SNS
    """
    sns_topic = os.environ.get('SNS_TOPIC')

    if not sns_topic:
        print("SNS topic not configured")
        return

    message = {
        'Title': finding.get('Title', 'Security Finding'),
        'Description': finding.get('Description', 'No description'),
        'Severity': finding.get('Severity', {}),
        'CustomTags': finding.get('CustomTags', []),
        'Resources': finding.get('Resources', []),
        'ProcessedAt': finding.get('ProcessedAt')
    }

    try:
        sns.publish(
            TopicArn=sns_topic,
            Subject=f"[CRITICAL] Security Alert: {finding.get('Title', 'Security Finding')}",
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'severity': {
                    'DataType': 'String',
                    'StringValue': finding.get('Severity', {}).get('Label', 'UNKNOWN')
                }
            }
        )
        print(f"Notification sent for finding: {finding.get('Id', 'unknown')}")
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")