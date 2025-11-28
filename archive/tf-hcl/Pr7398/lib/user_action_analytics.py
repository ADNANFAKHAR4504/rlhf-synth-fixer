"""
User Action Analytics Lambda Function
======================================
Analyzes authentication service logs to track user login patterns,
session durations, and authentication success rates.
"""

import json
import base64
import gzip
import os
import boto3
from datetime import datetime, timedelta
from collections import defaultdict

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Main handler for processing authentication service logs.
    
    Args:
        event: CloudWatch Logs event containing compressed log data
        context: Lambda context object
    
    Returns:
        dict: Response with processing status
    """
    
    # Extract environment variables
    namespace = os.environ.get('METRIC_NAMESPACE', 'CustomMetrics/Business')
    service_name = os.environ.get('SERVICE_NAME', 'auth-service')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    
    # Decode and decompress the log data
    log_data = json.loads(gzip.decompress(base64.b64decode(event['awslogs']['data'])))
    
    # Initialize data collectors
    action_counts = defaultdict(int)
    auth_methods = defaultdict(lambda: {'success': 0, 'failure': 0})
    user_sessions = {}
    failed_attempts = defaultdict(int)
    hourly_actions = defaultdict(lambda: defaultdict(int))
    
    # Process each log event
    for log_event in log_data['logEvents']:
        try:
            # Parse the log message as JSON
            message = json.loads(log_event['message'])
            
            # Extract authentication information
            action = message.get('action', 'unknown')
            user_id = message.get('user_id', 'anonymous')
            auth_method = message.get('auth_method', 'password')
            success = message.get('success', False)
            session_id = message.get('session_id')
            timestamp = log_event['timestamp'] / 1000
            hour = datetime.fromtimestamp(timestamp).hour
            
            # Track action counts
            action_counts[action] += 1
            hourly_actions[hour][action] += 1
            
            # Track authentication success/failure
            if action == 'login':
                if success:
                    auth_methods[auth_method]['success'] += 1
                    # Start session tracking
                    if session_id:
                        user_sessions[session_id] = {
                            'start': timestamp,
                            'user_id': user_id
                        }
                else:
                    auth_methods[auth_method]['failure'] += 1
                    failed_attempts[user_id] += 1
            
            # Track session end
            elif action == 'logout' and session_id in user_sessions:
                session_data = user_sessions[session_id]
                session_duration = timestamp - session_data['start']
                # Store session duration for metrics
                if 'durations' not in user_sessions:
                    user_sessions['durations'] = []
                user_sessions['durations'].append(session_duration)
                
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing log event: {e}")
            continue
    
    # Prepare CloudWatch metrics
    metrics = []
    timestamp = datetime.utcnow()
    
    # Publish action count metrics
    for action, count in action_counts.items():
        metrics.append({
            'MetricName': 'UserAction',
            'Value': count,
            'Unit': 'Count',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'Action', 'Value': action},
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Calculate and publish authentication success rates
    for method, stats in auth_methods.items():
        total = stats['success'] + stats['failure']
        if total > 0:
            success_rate = (stats['success'] / total) * 100
            
            metrics.append({
                'MetricName': 'AuthenticationSuccessRate',
                'Value': success_rate,
                'Unit': 'Percent',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'AuthMethod', 'Value': method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
            
            metrics.append({
                'MetricName': 'AuthenticationAttempts',
                'Value': total,
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'AuthMethod', 'Value': method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
    
    # Calculate session duration metrics
    if 'durations' in user_sessions and user_sessions['durations']:
        durations = user_sessions['durations']
        avg_duration = sum(durations) / len(durations)
        
        metrics.append({
            'MetricName': 'AverageSessionDuration',
            'Value': avg_duration,
            'Unit': 'Seconds',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        metrics.append({
            'MetricName': 'ActiveSessions',
            'Value': len(user_sessions) - 1,  # Exclude 'durations' key
            'Unit': 'Count',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Track users with multiple failed attempts (potential security issue)
    suspicious_users = sum(1 for attempts in failed_attempts.values() if attempts >= 3)
    if suspicious_users > 0:
        metrics.append({
            'MetricName': 'SuspiciousLoginAttempts',
            'Value': suspicious_users,
            'Unit': 'Count',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Publish hourly action distribution
    for hour, actions in hourly_actions.items():
        for action, count in actions.items():
            metrics.append({
                'MetricName': 'HourlyUserAction',
                'Value': count,
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'Hour', 'Value': str(hour)},
                    {'Name': 'Action', 'Value': action},
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
            'message': 'User analytics processed successfully',
            'metricsPublished': len(metrics),
            'uniqueActions': list(action_counts.keys()),
            'authMethods': list(auth_methods.keys())
        })
    }