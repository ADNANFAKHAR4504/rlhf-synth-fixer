import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    VPC Logging Lambda function for monitoring VPC Flow Logs
    """
    vpc_id = os.environ.get('VPC_ID')
    log_bucket = os.environ.get('LOG_BUCKET')
    environment = os.environ.get('ENVIRONMENT')
    
    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    logs = boto3.client('logs')
    
    try:
        # Check VPC Flow Logs status
        flow_logs = ec2.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )
        
        log_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'vpc_id': vpc_id,
            'environment': environment,
            'flow_logs_count': len(flow_logs['FlowLogs']),
            'flow_logs_status': [fl['FlowLogStatus'] for fl in flow_logs['FlowLogs']],
            'message': 'VPC logging monitoring completed'
        }
        
        # Log to CloudWatch
        print(json.dumps(log_message))
        
        return {
            'statusCode': 200,
            'body': json.dumps(log_message)
        }
        
    except Exception as e:
        error_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'vpc_id': vpc_id,
            'environment': environment,
            'error': str(e),
            'message': 'VPC logging monitoring failed'
        }
        
        print(json.dumps(error_message))
        
        return {
            'statusCode': 500,
            'body': json.dumps(error_message)
        }