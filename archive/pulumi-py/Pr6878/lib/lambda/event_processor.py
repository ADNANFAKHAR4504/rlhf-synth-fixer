"""
EventBridge event processing Lambda function.

This function processes events from EventBridge and updates
processing status in DynamoDB for audit and tracking purposes.
"""

import json
import boto3
import os
from datetime import datetime


def event_processor_handler(event, context):
    """Process events from EventBridge and update DynamoDB"""
    try:
        print(f"Processing EventBridge event: {json.dumps(event)}")
        
        # Parse EventBridge event
        detail = event['detail']
        webhook_id = detail['webhook_id']
        provider = detail.get('provider', 'unknown')
        payment_amount = detail.get('amount', 0)
        payment_type = detail.get('payment_type', 'unknown')
        
        # Determine payment category based on amount
        payment_category = categorize_payment(payment_amount)
        
        # Update DynamoDB with additional processing info
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        table.update_item(
            Key={'webhook_id': webhook_id},
            UpdateExpression='SET event_processed = :val, event_timestamp = :ts, payment_category = :cat, final_status = :status',
            ExpressionAttributeValues={
                ':val': True,
                ':ts': datetime.utcnow().isoformat(),
                ':cat': payment_category,
                ':status': 'completed'
            }
        )
        
        print(f"Updated webhook {webhook_id} with event processing info")
        
        # Log payment processing metrics
        log_payment_metrics(provider, payment_amount, payment_category, payment_type)
        
        return {'statusCode': 200, 'message': 'Event processed successfully'}
        
    except Exception as e:
        print(f"Error processing EventBridge event: {str(e)}")
        raise


def categorize_payment(amount):
    """Categorize payment based on amount thresholds"""
    if amount <= 100:
        return "small"
    elif amount <= 1000:
        return "medium"
    elif amount <= 10000:
        return "large"
    else:
        return "xlarge"


def log_payment_metrics(provider, amount, category, payment_type):
    """Log payment processing metrics for monitoring"""
    try:
        # In production, this could send custom metrics to CloudWatch
        cloudwatch = boto3.client('cloudwatch')
        
        cloudwatch.put_metric_data(
            Namespace='WebhookProcessing',
            MetricData=[
                {
                    'MetricName': 'PaymentProcessed',
                    'Dimensions': [
                        {
                            'Name': 'Provider',
                            'Value': provider
                        },
                        {
                            'Name': 'Category',
                            'Value': category
                        },
                        {
                            'Name': 'PaymentType', 
                            'Value': payment_type
                        }
                    ],
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'PaymentAmount',
                    'Dimensions': [
                        {
                            'Name': 'Provider',
                            'Value': provider
                        }
                    ],
                    'Value': amount,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        print(f"Logged metrics for {provider} payment of {amount} ({category})")
        
    except Exception as e:
        print(f"Error logging metrics: {str(e)}")
        # Don't raise - metrics logging shouldn't fail the main processing