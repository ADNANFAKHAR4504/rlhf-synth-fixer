"""
Order Value Tracker Lambda Function
====================================
Processes order service logs to calculate average order values,
total revenue, and order distribution metrics.
"""

import json
import base64
import gzip
import os
import boto3
from datetime import datetime
from statistics import mean, median

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Main handler for processing order service logs.
    
    Args:
        event: CloudWatch Logs event containing compressed log data
        context: Lambda context object
    
    Returns:
        dict: Response with processing status
    """
    
    # Extract environment variables
    namespace = os.environ.get('METRIC_NAMESPACE', 'CustomMetrics/Business')
    service_name = os.environ.get('SERVICE_NAME', 'order-service')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    
    # Decode and decompress the log data
    log_data = json.loads(gzip.decompress(base64.b64decode(event['awslogs']['data'])))
    
    # Initialize data collectors
    order_values = []
    order_categories = {}
    order_statuses = {'completed': 0, 'pending': 0, 'cancelled': 0}
    hourly_orders = defaultdict(list)
    
    # Process each log event
    for log_event in log_data['logEvents']:
        try:
            # Parse the log message as JSON
            message = json.loads(log_event['message'])
            
            # Extract order information
            order_value = float(message.get('order_value', 0))
            order_status = message.get('order_status', 'pending')
            category = message.get('category', 'uncategorized')
            timestamp = log_event['timestamp'] / 1000  # Convert to seconds
            hour = datetime.fromtimestamp(timestamp).hour
            
            if order_value > 0:
                order_values.append(order_value)
                hourly_orders[hour].append(order_value)
                
                # Track category totals
                if category not in order_categories:
                    order_categories[category] = {'count': 0, 'total': 0}
                order_categories[category]['count'] += 1
                order_categories[category]['total'] += order_value
                
                # Track order status
                if order_status in order_statuses:
                    order_statuses[order_status] += 1
                    
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing log event: {e}")
            continue
    
    # Prepare CloudWatch metrics
    metrics = []
    timestamp = datetime.utcnow()
    
    # Calculate and publish order statistics
    if order_values:
        avg_order_value = mean(order_values)
        median_order_value = median(order_values)
        total_revenue = sum(order_values)
        order_count = len(order_values)
        
        # Average order value metric
        metrics.append({
            'MetricName': 'AverageOrderValue',
            'Value': avg_order_value,
            'Unit': 'None',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        # Median order value metric
        metrics.append({
            'MetricName': 'MedianOrderValue',
            'Value': median_order_value,
            'Unit': 'None',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        # Total revenue metric
        metrics.append({
            'MetricName': 'TotalRevenue',
            'Value': total_revenue,
            'Unit': 'None',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        # Order count metric
        metrics.append({
            'MetricName': 'OrderCount',
            'Value': order_count,
            'Unit': 'Count',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Publish category-specific metrics
    for category, data in order_categories.items():
        if data['count'] > 0:
            category_avg = data['total'] / data['count']
            
            metrics.append({
                'MetricName': 'CategoryOrderValue',
                'Value': category_avg,
                'Unit': 'None',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'Category', 'Value': category},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
            
            metrics.append({
                'MetricName': 'CategoryOrderCount',
                'Value': data['count'],
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'Category', 'Value': category},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
    
    # Publish order status metrics
    for status, count in order_statuses.items():
        if count > 0:
            metrics.append({
                'MetricName': 'OrderStatus',
                'Value': count,
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'Status', 'Value': status},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
    
    # Publish hourly distribution metrics
    for hour, values in hourly_orders.items():
        if values:
            hourly_avg = mean(values)
            metrics.append({
                'MetricName': 'HourlyOrderValue',
                'Value': hourly_avg,
                'Unit': 'None',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'Hour', 'Value': str(hour)},
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
            'message': 'Order metrics processed successfully',
            'metricsPublished': len(metrics),
            'ordersProcessed': len(order_values),
            'categories': list(order_categories.keys())
        })
    }