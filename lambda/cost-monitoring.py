import json
import boto3
import os
import re
from datetime import datetime, timedelta

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Process CloudWatch logs and monitor resource costs/usage patterns.
    Analyzes build metrics, resource utilization, and sends notifications.
    """
    try:
        # Parse CloudWatch log event
        if 'awslogs' in event:
            # Decode CloudWatch Logs data
            log_data = process_cloudwatch_logs(event)
            
            # Analyze build patterns and costs
            cost_analysis = analyze_build_costs(log_data)
            
            # Store metrics in DynamoDB
            store_cost_metrics(cost_analysis)
            
            # Send notifications if thresholds exceeded
            if cost_analysis.get('alert_required', False):
                send_cost_alert(cost_analysis)
                
        elif 'source' in event and event['source'] == 'aws.codepipeline':
            # Process CodePipeline state changes
            pipeline_analysis = analyze_pipeline_event(event)
            
            if pipeline_analysis.get('alert_required', False):
                send_pipeline_alert(pipeline_analysis)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Cost monitoring completed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"Error in cost monitoring: {str(e)}")
        send_error_notification(str(e))
        raise

def process_cloudwatch_logs(event):
    """Process compressed CloudWatch logs data"""
    import gzip
    import base64
    
    compressed_payload = base64.b64decode(event['awslogs']['data'])
    uncompressed_payload = gzip.decompress(compressed_payload)
    log_data = json.loads(uncompressed_payload)
    
    return log_data

def analyze_build_costs(log_data):
    """Analyze build costs and resource usage from logs"""
    analysis = {
        'timestamp': datetime.utcnow().isoformat(),
        'build_duration': 0,
        'resource_usage': {},
        'cost_estimate': 0,
        'alert_required': False
    }
    
    log_events = log_data.get('logEvents', [])
    
    for event in log_events:
        message = event.get('message', '')
        timestamp = event.get('timestamp', 0)
        
        # Extract build duration patterns
        if 'Build completed' in message or 'SUCCEEDED' in message:
            # Calculate build duration and cost estimate
            duration_match = re.search(r'Duration: (\d+)', message)
            if duration_match:
                duration = int(duration_match.group(1))
                analysis['build_duration'] = duration
                # Estimate cost: $0.005 per build minute for CodeBuild
                analysis['cost_estimate'] = (duration / 60) * 0.005
        
        # Monitor resource usage patterns
        if 'Memory' in message or 'CPU' in message:
            resource_match = re.search(r'(Memory|CPU): ([\d.]+)', message)
            if resource_match:
                resource_type = resource_match.group(1)
                usage = float(resource_match.group(2))
                analysis['resource_usage'][resource_type] = usage
    
    # Determine if alert is required
    if analysis['cost_estimate'] > 5.0:  # Alert if build costs > $5
        analysis['alert_required'] = True
        analysis['alert_reason'] = f"High build cost: ${analysis['cost_estimate']:.2f}"
    elif analysis['build_duration'] > 1800:  # Alert if build > 30 minutes
        analysis['alert_required'] = True
        analysis['alert_reason'] = f"Long build duration: {analysis['build_duration']} seconds"
    
    return analysis

def analyze_pipeline_event(event):
    """Analyze CodePipeline events for cost and performance insights"""
    detail = event.get('detail', {})
    state = detail.get('state', '')
    pipeline_name = detail.get('pipeline', '')
    
    analysis = {
        'timestamp': datetime.utcnow().isoformat(),
        'pipeline_name': pipeline_name,
        'state': state,
        'alert_required': False
    }
    
    # Alert on failures or long-running pipelines
    if state == 'FAILED':
        analysis['alert_required'] = True
        analysis['alert_reason'] = f"Pipeline {pipeline_name} failed"
    
    return analysis

def store_cost_metrics(analysis):
    """Store cost analysis metrics in DynamoDB"""
    table_name = os.environ.get('TABLE_NAME')
    if not table_name:
        return
    
    table = dynamodb.Table(table_name)
    
    # Store cost metrics
    table.put_item(
        Item={
            'buildId': f"cost-analysis-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            'timestamp': analysis['timestamp'],
            'type': 'COST_ANALYSIS',
            'build_duration': analysis.get('build_duration', 0),
            'cost_estimate': str(analysis.get('cost_estimate', 0)),
            'resource_usage': json.dumps(analysis.get('resource_usage', {})),
            'alert_required': analysis.get('alert_required', False)
        }
    )

def send_cost_alert(analysis):
    """Send cost alert notification"""
    topic_arn = os.environ.get('SNS_TOPIC_ARN')
    project_name = os.environ.get('PROJECT_NAME', 'Unknown')
    
    message = {
        'alert_type': 'COST_MONITORING',
        'project': project_name,
        'timestamp': analysis['timestamp'],
        'reason': analysis.get('alert_reason', 'Unknown'),
        'details': {
            'build_duration': analysis.get('build_duration', 0),
            'cost_estimate': analysis.get('cost_estimate', 0),
            'resource_usage': analysis.get('resource_usage', {})
        }
    }
    
    sns.publish(
        TopicArn=topic_arn,
        Subject=f'[{project_name}] Cost Monitoring Alert',
        Message=json.dumps(message, indent=2)
    )

def send_pipeline_alert(analysis):
    """Send pipeline event alert"""
    topic_arn = os.environ.get('SNS_TOPIC_ARN')
    project_name = os.environ.get('PROJECT_NAME', 'Unknown')
    
    message = {
        'alert_type': 'PIPELINE_EVENT',
        'project': project_name,
        'pipeline_name': analysis['pipeline_name'],
        'state': analysis['state'],
        'timestamp': analysis['timestamp'],
        'reason': analysis.get('alert_reason', 'Pipeline state change')
    }
    
    sns.publish(
        TopicArn=topic_arn,
        Subject=f'[{project_name}] Pipeline Alert: {analysis["pipeline_name"]}',
        Message=json.dumps(message, indent=2)
    )

def send_error_notification(error_msg):
    """Send error notification"""
    topic_arn = os.environ.get('SNS_TOPIC_ARN')
    project_name = os.environ.get('PROJECT_NAME', 'Unknown')
    
    if topic_arn:
        sns.publish(
            TopicArn=topic_arn,
            Subject=f'[{project_name}] Cost Monitoring Error',
            Message=f'Error in cost monitoring Lambda: {error_msg}'
        )
