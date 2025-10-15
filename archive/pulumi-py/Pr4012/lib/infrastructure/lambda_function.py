"""
Lambda functions for the serverless application.

This module creates Lambda functions with proper outputs, environment variables,
and integration with other AWS services.
"""

import base64
import json
from typing import Any, Dict, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import lambda_

from .config import InfrastructureConfig


class LambdaStack:
    """
    Lambda stack for serverless compute functions.
    
    Creates Lambda functions with proper environment variables, outputs,
    and integration with other AWS services.
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        iam_stack: 'IAMStack',
        s3_stack: 'S3Stack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize Lambda stack with functions and configurations.
        
        Args:
            config: Infrastructure configuration
            iam_stack: IAM stack for roles
            s3_stack: S3 stack for buckets
            opts: Pulumi resource options
        """
        self.config = config
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.opts = opts or ResourceOptions()
        
        # Create Lambda functions
        self.main_function = self._create_main_function()
        self.log_processor_function = self._create_log_processor_function()
        
    def _create_main_function(self) -> lambda_.Function:
        """
        Create the main Lambda function for API Gateway integration.
        
        Returns:
            Main Lambda function
        """
        function_name = self.config.get_resource_name('lambda', 'main')
        
        # Lambda function code
        lambda_code = """
import json
import logging
import os
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    '''
    Main Lambda function handler for API Gateway integration.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    '''
    try:
        # Log the incoming request
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters', {})
        
        # Process the request
        response_body = {
            'message': 'Hello from serverless application!',
            'timestamp': datetime.utcnow().isoformat(),
            'method': http_method,
            'path': path,
            'query_params': query_params,
            'environment': os.environ.get('ENVIRONMENT', 'dev')
        }
        
        # Return API Gateway response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
"""
        
        # Create the Lambda function
        function = lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            role=self.iam_stack.get_lambda_execution_role_arn(),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'PROJECT_NAME': self.config.project_name,
                    'LOGS_BUCKET': self.s3_stack.get_logs_bucket_name()
                }
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return function
    
    def _create_log_processor_function(self) -> lambda_.Function:
        """
        Create Lambda function for processing logs and exporting to S3.
        
        Returns:
            Log processor Lambda function
        """
        function_name = self.config.get_resource_name('lambda', 'log-processor')
        
        # Log processor function code
        log_processor_code = """
import json
import logging
import boto3
import gzip
from datetime import datetime
from io import BytesIO

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
logs_client = boto3.client('logs')

def lambda_handler(event, context):
    '''
    Log processor function for exporting CloudWatch logs to S3.
    
    Args:
        event: CloudWatch Logs event
        context: Lambda context
        
    Returns:
        Processing status
    '''
    try:
        logger.info(f"Processing log event: {json.dumps(event)}")
        
        # Extract log group and stream information
        log_group = event.get('logGroup', '')
        log_stream = event.get('logStream', '')
        
        # Get log events
        response = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=log_stream
        )
        
        # Process and format log events
        log_events = []
        for event_data in response.get('events', []):
            log_events.append({
                'timestamp': event_data.get('timestamp'),
                'message': event_data.get('message'),
                'log_group': log_group,
                'log_stream': log_stream
            })
        
        # Create log file content
        log_content = json.dumps(log_events, indent=2)
        
        # Compress the log content
        compressed_content = gzip.compress(log_content.encode('utf-8'))
        
        # Upload to S3
        bucket_name = os.environ.get('LOGS_BUCKET')
        if bucket_name:
            s3_key = f"logs/{log_group}/{log_stream}/{datetime.utcnow().strftime('%Y/%m/%d')}/logs.json.gz"
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=compressed_content,
                ContentType='application/gzip',
                ServerSideEncryption='AES256'
            )
            
            logger.info(f"Successfully uploaded logs to s3://{bucket_name}/{s3_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Logs processed successfully',
                'log_group': log_group,
                'log_stream': log_stream,
                'events_processed': len(log_events)
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing logs: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process logs',
                'message': str(e)
            })
        }
"""
        
        # Create the log processor function
        function = lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(log_processor_code)
            }),
            role=self.iam_stack.get_log_processing_role_arn(),
            timeout=30,  # 30 seconds for log processing
            memory_size=256,  # More memory for log processing
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'PROJECT_NAME': self.config.project_name,
                    'LOGS_BUCKET': self.s3_stack.get_logs_bucket_name()
                }
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return function
    
    def get_main_function_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the main Lambda function.
        
        Returns:
            ARN of the main Lambda function
        """
        return self.main_function.arn
    
    def get_main_function_name(self) -> pulumi.Output[str]:
        """
        Get the name of the main Lambda function.
        
        Returns:
            Name of the main Lambda function
        """
        return self.main_function.name
    
    def get_main_function_invoke_arn(self) -> pulumi.Output[str]:
        """
        Get the invoke ARN of the main Lambda function.
        
        Returns:
            Invoke ARN of the main Lambda function
        """
        return self.main_function.invoke_arn
    
    def get_log_processor_function_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the log processor function.
        
        Returns:
            ARN of the log processor function
        """
        return self.log_processor_function.arn
    
    def get_log_processor_function_name(self) -> pulumi.Output[str]:
        """
        Get the name of the log processor function.
        
        Returns:
            Name of the log processor function
        """
        return self.log_processor_function.name
