import json
import os
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

sns = boto3.client('sns')
alert_topic_arn = os.environ['ALERT_TOPIC_ARN']

@xray_recorder.capture('audit_logger')
def handler(event, context):
    """
    Logs all DynamoDB stream events for audit purposes
    """
    try:
        print(f"Processing {len(event['Records'])} DynamoDB stream records")

        for record in event['Records']:
            event_name = record['eventName']
            webhook_id = record['dynamodb'].get('Keys', {}).get('webhookId', {}).get('S', 'unknown')

            # Log the event
            log_entry = {
                'eventName': event_name,
                'webhookId': webhook_id,
                'eventTime': record.get('dynamodb', {}).get('ApproximateCreationDateTime'),
            }

            print(f"Audit log: {json.dumps(log_entry)}")

            # Send alert for critical events
            if event_name == 'REMOVE':
                sns.publish(
                    TopicArn=alert_topic_arn,
                    Subject='Webhook Deleted - Audit Alert',
                    Message=json.dumps(log_entry),
                )

        return {
            'statusCode': 200,
            'message': f'Processed {len(event["Records"])} audit records',
        }

    except Exception as e:
        print(f"Error in audit logger: {str(e)}")
        raise e
