import json
import os
import boto3

sns = boto3.client('sns')

def handler(event, context):
    """
    Process GuardDuty findings and send alerts
    """
    try:
        detail = event.get('detail', {})
        severity = detail.get('severity', 0)
        finding_type = detail.get('type', 'Unknown')
        
        message = {
            'severity': severity,
            'type': finding_type,
            'description': detail.get('description', 'No description'),
            'region': event.get('region', 'unknown')
        }
        
        sns_topic = os.environ.get('SNS_TOPIC_ARN')
        if sns_topic:
            sns.publish(
                TopicArn=sns_topic,
                Message=json.dumps(message, indent=2),
                Subject=f'Security Alert: {finding_type}'
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Alert processed successfully')
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        raise
