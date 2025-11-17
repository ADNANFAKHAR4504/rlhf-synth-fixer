"""
Lambda functions module for serverless compute.

This module creates and manages Lambda functions with proper configuration,
environment variables, and CloudWatch logging.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .iam import IAMStack
from .kms import KMSStack
from .storage import StorageStack


class LambdaStack:
    """
    Manages Lambda functions for the serverless processor.
    
    Creates Lambda functions with proper IAM roles, environment variables,
    CloudWatch logging, and X-Ray tracing.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance for IAM roles
            storage_stack: StorageStack instance for S3 access
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.kms_stack = kms_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_functions()
    
    def _create_functions(self):
        """Create Lambda functions."""
        self._create_processor_function()
    
    def _create_processor_function(self):
        """Create the main processor Lambda function."""
        function_name = 'processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[function_name] = log_group
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            s3_bucket_arns=[self.storage_stack.get_bucket_arn('processed-data')],
            kms_key_arns=[self.kms_stack.get_key_arn('s3')],
            log_group_arn=log_group.arn
        )
        
        processing_config_json = Output.from_input(self.config.processing_config).apply(
            lambda config: json.dumps(config)
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='processor_handler.handler',
            role=role.arn,
            code=FileArchive('./lib/infrastructure/lambda_code'),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.storage_stack.get_bucket_name('processed-data'),
                    'PROCESSING_CONFIG': processing_config_json,
                    'ENVIRONMENT': self.config.environment,
                    'LOG_LEVEL': 'INFO'
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[log_group, role])
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get Lambda function resource.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Lambda function resource
        """
        return self.functions[function_name]
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get Lambda function name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function name as Output
        """
        return self.functions[function_name].name
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function ARN.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function ARN as Output
        """
        return self.functions[function_name].arn
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function invoke ARN.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function invoke ARN as Output
        """
        return self.functions[function_name].invoke_arn
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get CloudWatch log group name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Log group name as Output
        """
        return self.log_groups[function_name].name
    
    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """
        Get CloudWatch log group ARN.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Log group ARN as Output
        """
        return self.log_groups[function_name].arn

