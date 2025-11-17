"""
Notification handler Lambda function.

This function sends notifications via SNS for transaction events.
"""

import json
import os

import boto3

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for sending notifications.
    
    Args:
        event: Event data
        context: Lambda context
        
    Returns:
        Success response
    """
    try:
        topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        for record in event.get('Records', []):
            message_body = record.get('body', '{}')
            message_data = json.loads(message_body)
            
            sns.publish(
                TopicArn=topic_arn,
                Subject='Transaction Notification',
                Message=json.dumps(message_data)
            )
        
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'NotificationsSent',
                    'Value': len(event.get('Records', [])),
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Notifications sent successfully'})
        }
        
    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'NotificationErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
