import json
import os
import time
import boto3
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
sns = boto3.client('sns')

# Environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Implement exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            if e.response['Error']['Code'] in ['Throttled', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Retry attempt {attempt + 1}/{max_retries} after {delay}s")
                    time.sleep(delay)
                else:
                    raise
            else:
                raise

@tracer.capture_method
def format_notification_message(payment_data: Dict[str, Any]) -> str:
    """Format payment data into notification message"""
    amount = payment_data.get('amount', 'N/A')
    currency = payment_data.get('currency', 'USD')
    payment_id = payment_data.get('payment_id', 'Unknown')
    customer_id = payment_data.get('customer_id', 'Unknown')
    timestamp = payment_data.get('processed_at', 'Unknown')
    
    message = f"""
*** HIGH VALUE PAYMENT ALERT ***

Payment Details:
- Payment ID: {payment_id}
- Amount: {currency} {amount:,}
- Customer ID: {customer_id}
- Processed At: {timestamp}

This payment exceeds the high-value threshold and requires immediate attention.

Action Required:
1. Review the transaction in the payment dashboard
2. Verify customer identity if necessary
3. Check for any suspicious activity patterns

This is an automated notification from the Payment Processing System.
"""
    return message

@tracer.capture_method
def send_notification(message: str, subject: str, payment_id: str) -> None:
    """Send notification via SNS with retry logic"""
    def publish_message():
        return sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject=subject,
            MessageAttributes={
                'payment_id': {
                    'DataType': 'String',
                    'StringValue': payment_id
                },
                'notification_type': {
                    'DataType': 'String',
                    'StringValue': 'high_value_payment'
                }
            }
        )
    
    response = exponential_backoff_retry(publish_message)
    logger.info(f"Notification sent successfully. MessageId: {response['MessageId']}")

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler for sending notifications"""
    try:
        # Handle EventBridge event format
        if 'detail' in event:
            payment_data = event['detail']
        # Handle direct invocation
        elif 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event
        
        payment_id = payment_data.get('payment_id', 'Unknown')
        logger.append_keys(payment_id=payment_id)
        
        # Format notification
        message = format_notification_message(payment_data)
        subject = f"High Value Payment Alert - {payment_id}"
        
        # Send notification
        send_notification(message, subject, payment_id)
        
        # Record metrics
        metrics.add_metric(name="NotificationSent", unit=MetricUnit.Count, value=1)
        
        logger.info(f"Successfully processed notification for payment {payment_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notification sent successfully',
                'payment_id': payment_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        metrics.add_metric(name="NotificationError", unit=MetricUnit.Count, value=1)
        
        # Re-raise to trigger retry/DLQ
        raise