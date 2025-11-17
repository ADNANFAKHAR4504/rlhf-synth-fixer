"""
Lambda function for logging deployment events.

This function is triggered after successful deployments to log
custom metrics and deployment summaries to CloudWatch.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict

import boto3

cloudwatch = boto3.client('cloudwatch')
logs = boto3.client('logs')
sns = boto3.client('sns')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for deployment logging.
    
    Args:
        event: CodePipeline event
        context: Lambda context
    
    Returns:
        Response dict
    """
    try:
        request_id = context.aws_request_id
        timestamp = datetime.utcnow().isoformat()
        
        project_name = os.environ.get('PROJECT_NAME', 'unknown')
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN', '')
        
        pipeline_name = event.get('detail', {}).get('pipeline', 'unknown')
        execution_id = event.get('detail', {}).get('execution-id', 'unknown')
        state = event.get('detail', {}).get('state', 'unknown')
        
        log_message = {
            'timestamp': timestamp,
            'request_id': request_id,
            'project_name': project_name,
            'pipeline_name': pipeline_name,
            'execution_id': execution_id,
            'state': state,
            'event': event
        }
        
        print(json.dumps(log_message))
        
        cloudwatch.put_metric_data(
            Namespace='CICDPipeline/Deployments',
            MetricData=[
                {
                    'MetricName': 'DeploymentEvent',
                    'Value': 1.0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {'Name': 'PipelineName', 'Value': pipeline_name},
                        {'Name': 'State', 'Value': state}
                    ]
                }
            ]
        )
        
        if state == 'SUCCEEDED' and sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f'Deployment Success: {pipeline_name}',
                Message=json.dumps(log_message, indent=2)
            )
        elif state == 'FAILED' and sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f'Deployment Failed: {pipeline_name}',
                Message=json.dumps(log_message, indent=2)
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Deployment logged successfully',
                'request_id': request_id
            })
        }
    
    except Exception as e:
        error_message = f'Error logging deployment: {str(e)}'
        print(error_message)
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message
            })
        }
