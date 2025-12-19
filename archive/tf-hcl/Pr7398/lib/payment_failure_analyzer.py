"""
Payment Failure Analyzer Lambda Function
========================================
Processes payment service logs to calculate failure rates by payment method
and publish custom CloudWatch metrics for business intelligence.
"""

import json
import base64
import gzip
import os
import boto3
from datetime import datetime
from collections import defaultdict

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Main handler for processing CloudWatch Logs events.
    
    Args:
        event: CloudWatch Logs event containing compressed log data
        context: Lambda context object
    
    Returns:
        dict: Response with processing status
    """
    
    # Extract environment variables
    namespace = os.environ.get('METRIC_NAMESPACE', 'CustomMetrics/Business')
    service_name = os.environ.get('SERVICE_NAME', 'payment-service')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    
    # Decode and decompress the log data
    log_data = json.loads(gzip.decompress(base64.b64decode(event['awslogs']['data'])))
    
    # Initialize counters for payment methods
    payment_stats = defaultdict(lambda: {'total': 0, 'failed': 0})
    total_amount = 0
    failed_amount = 0
    
    # Process each log event
    for log_event in log_data['logEvents']:
        try:
            # Parse the log message as JSON
            message = json.loads(log_event['message'])
            
            # Extract payment information
            payment_method = message.get('payment_method', 'unknown')
            status = message.get('status', 200)
            amount = float(message.get('payment_amount', 0))
            
            # Update statistics
            payment_stats[payment_method]['total'] += 1
            total_amount += amount
            
            # Check if payment failed (4xx or 5xx status)
            if status >= 400:
                payment_stats[payment_method]['failed'] += 1
                failed_amount += amount
                
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Log parsing errors for debugging
            print(f"Error parsing log event: {e}")
            continue
    
    # Prepare CloudWatch metrics
    metrics = []
    timestamp = datetime.utcnow()
    
    # Calculate failure rates for each payment method
    for payment_method, stats in payment_stats.items():
        if stats['total'] > 0:
            failure_rate = (stats['failed'] / stats['total']) * 100
            
            # Add failure rate metric
            metrics.append({
                'MetricName': 'PaymentFailureRate',
                'Value': failure_rate,
                'Unit': 'Percent',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'PaymentMethod', 'Value': payment_method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
            
            # Add transaction count metrics
            metrics.append({
                'MetricName': 'PaymentTransactions',
                'Value': stats['total'],
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'PaymentMethod', 'Value': payment_method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
    
    # Add total payment amount metrics
    if total_amount > 0:
        metrics.append({
            'MetricName': 'PaymentVolume',
            'Value': total_amount,
            'Unit': 'None',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        # Calculate overall failure rate
        overall_failure_rate = (failed_amount / total_amount) * 100
        metrics.append({
            'MetricName': 'PaymentVolumeFailureRate',
            'Value': overall_failure_rate,
            'Unit': 'Percent',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Publish metrics to CloudWatch
    if metrics:
        # CloudWatch PutMetricData accepts max 20 metrics per call
        for i in range(0, len(metrics), 20):
            batch = metrics[i:i+20]
            cloudwatch.put_metric_data(
                Namespace=namespace,
                MetricData=batch
            )
        
        print(f"Published {len(metrics)} metrics to CloudWatch")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment metrics processed successfully',
            'metricsPublished': len(metrics),
            'paymentMethods': list(payment_stats.keys())
        })
    }