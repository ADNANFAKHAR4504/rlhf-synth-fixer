import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sqs = boto3.client('sqs')
sns = boto3.client('sns')

# Environment variables
QUEUE_URL = os.environ['QUEUE_URL']
DLQ_URL = os.environ['DLQ_URL']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

@xray_recorder.capture('check_queue_health')
def check_queue_health(queue_url, queue_name):
    """Check health metrics for a queue"""
    try:
        # Get queue attributes
        response = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['All']
        )

        attributes = response['Attributes']

        # Extract key metrics
        metrics = {
            'queue_name': queue_name,
            'messages_available': int(attributes.get('ApproximateNumberOfMessages', 0)),
            'messages_in_flight': int(attributes.get('ApproximateNumberOfMessagesNotVisible', 0)),
            'messages_delayed': int(attributes.get('ApproximateNumberOfMessagesDelayed', 0))
        }

        logger.info(f"Queue {queue_name} metrics: {json.dumps(metrics)}")

        return metrics

    except Exception as e:
        logger.error(f"Error checking queue health for {queue_name}: {str(e)}")
        raise

def send_alert(message, subject="Queue Health Check Alert"):
    """Send alert via SNS"""
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        logger.info(f"Alert sent: {subject}")
    except Exception as e:
        logger.error(f"Failed to send alert: {str(e)}")

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """Main Lambda handler for health checks"""
    try:
        # Check main queue health
        main_queue_metrics = check_queue_health(QUEUE_URL, "quiz-submissions")

        # Check DLQ health
        dlq_metrics = check_queue_health(DLQ_URL, "quiz-submissions-dlq")

        # Check for issues
        alerts = []

        # Alert if too many messages in DLQ
        if dlq_metrics['messages_available'] > 10:
            alerts.append(f"WARNING: {dlq_metrics['messages_available']} messages in Dead Letter Queue")

        # Alert if main queue is backing up
        total_messages = main_queue_metrics['messages_available'] + main_queue_metrics['messages_in_flight']
        if total_messages > 500:
            alerts.append(f"WARNING: High message count in main queue: {total_messages}")

        # Send consolidated alert if issues found
        if alerts:
            alert_message = "Queue Health Issues Detected:\n\n" + "\n".join(alerts)
            alert_message += f"\n\nMain Queue Metrics: {json.dumps(main_queue_metrics, indent=2)}"
            alert_message += f"\n\nDLQ Metrics: {json.dumps(dlq_metrics, indent=2)}"
            send_alert(alert_message)

        # Return health check results
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Health check completed',
                'main_queue': main_queue_metrics,
                'dlq': dlq_metrics,
                'alerts_sent': len(alerts)
            })
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        # Send critical alert
        send_alert(f"CRITICAL: Health check Lambda failed with error: {str(e)}", "Critical Health Check Failure")
        raise