"""
Lambda functions for the event processing pipeline.

This module creates Lambda functions with latest runtime, X-Ray tracing,
and proper packaging for the trading event processing.
"""

import os
from typing import Dict

import pulumi
from aws_provider import AWSProviderManager
from iam import IAMStack
from pulumi import AssetArchive, FileArchive
from pulumi_aws import lambda_

from config import PipelineConfig


class LambdaStack:
    """Creates Lambda functions for event processing."""
    
    def __init__(self, config: PipelineConfig, provider_manager: AWSProviderManager, iam_stack: IAMStack, dynamodb_stack):
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.functions: Dict[str, lambda_.Function] = {}
        
        self._create_event_processor_function()
    
    def _create_event_processor_function(self):
        """Create the main event processor Lambda function."""
        for region in self.config.regions:
            function_name = self.config.get_resource_name('event-processor', region)
            
            # Create deployment package
            code_archive = self._create_deployment_package()
            
            # Environment variables - use actual DynamoDB table name from dynamodb_stack
            environment_vars = {
                'DYNAMODB_TABLE_NAME': self.dynamodb_stack.get_table_name(region),
                'LOG_LEVEL': 'INFO'
            }
            
            self.functions[f'event-processor-{region}'] = lambda_.Function(
                f"event-processor-{region}",
                name=function_name,
                runtime=self.config.lambda_runtime,
                handler="event_processor.lambda_handler",
                code=code_archive,
                role=self.iam_stack.get_lambda_role_arn(region),
                timeout=self.config.lambda_timeout,
                memory_size=self.config.lambda_memory_size,
                environment=lambda_.FunctionEnvironmentArgs(
                    variables=environment_vars
                ),
                tracing_config=lambda_.FunctionTracingConfigArgs(
                    mode="Active"  # Enable X-Ray tracing
                ),
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_deployment_package(self) -> AssetArchive:
        """Create deployment package for Lambda function."""
        # Get the directory containing the Lambda code
        lambda_code_dir = os.path.join(os.path.dirname(__file__), 'lambda_code')
        
        # Use FileArchive directly - Pulumi will handle the packaging
        return FileArchive(lambda_code_dir)
    
    def get_function_arn(self, region: str) -> pulumi.Output[str]:
        """Get Lambda function ARN for a region."""
        return self.functions[f'event-processor-{region}'].arn
    
    def get_function_name(self, region: str) -> pulumi.Output[str]:
        """Get Lambda function name for a region."""
        return self.functions[f'event-processor-{region}'].name
