import json
import os
import boto3

def handler(event, context):
    """
    Notification Lambda function.
    Sends notifications for payment events.
    """
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    sns = boto3.client('sns')

    body = json.loads(event['body'])

    # Send notification
    message = body.get('message', 'Payment notification')

    # In production, would send to actual SNS topic
    return {
        'statusCode': 200,
        'body': json.dumps({
            'notification_sent': True,
            'message': message,
            'region': dr_role
        })
    }
