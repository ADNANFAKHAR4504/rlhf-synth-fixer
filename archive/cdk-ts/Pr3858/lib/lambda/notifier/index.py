import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

table = dynamodb.Table(os.environ['JOB_TABLE_NAME'])
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    print(f"Sending notification: {json.dumps(event)}")

    try:
        status = event['status']
        job_id = event['jobId']

        if status == 'SUCCESS':
            message = f"Document conversion completed successfully.\nJob ID: {job_id}\nOutput: {event.get('outputKey', 'N/A')}"
            subject = f"Conversion Success - {job_id}"
        else:
            message = f"Document conversion failed.\nJob ID: {job_id}\nError: {event.get('error', 'Unknown error')}"
            subject = f"Conversion Failed - {job_id}"

        # Send SNS notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject=subject
        )

        print(f"Notification sent for job {job_id}")

        return {
            'jobId': job_id,
            'status': status,
            'notificationSent': True
        }

    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        raise
