"""
Lambda functions module for managing Lambda resources.

This module creates and configures Lambda functions with X-Ray tracing,
CloudWatch log groups, and proper IAM roles.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig
from .iam import IAMStack
from .kms import KMSStack


class LambdaStack:
    """
    Manages Lambda functions for the CI/CD pipeline.
    
    Creates Lambda functions with X-Ray tracing, CloudWatch logging,
    and KMS encryption for environment variables.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.kms_stack = kms_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.aliases: Dict[str, aws.lambda_.Alias] = {}
        
        self._create_deployment_function()
    
    def _create_deployment_function(self):
        """Create the main deployment Lambda function."""
        function_name = 'deployment'
        resource_name = self.config.get_resource_name(function_name)
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-logs',
            name=f"/aws/lambda/{resource_name}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f"/aws/lambda/{resource_name}"
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[function_name] = log_group
        
        lambda_key = self.kms_stack.get_key('lambda')
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group.arn,
            lambda_key.arn
        )
        
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='deployment_handler.handler',
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            kms_key_arn=lambda_key.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'REGION': self.config.primary_region
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            publish=True,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'Deployment handler'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[role, log_group, lambda_key]
            )
        )
        
        alias = aws.lambda_.Alias(
            f'{function_name}-prod-alias',
            name='production',
            function_name=function.name,
            function_version=function.version,
            opts=self.provider_manager.get_resource_options(depends_on=[function])
        )
        
        self.functions[function_name] = function
        self.aliases[function_name] = alias
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get a Lambda function by name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Lambda Function resource
        """
        if function_name not in self.functions:
            raise ValueError(f"Function '{function_name}' not found")
        return self.functions[function_name]
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get the name of a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function name as Output[str]
        """
        return self.get_function(function_name).name
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get the ARN of a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function ARN as Output[str]
        """
        return self.get_function(function_name).arn
    
    def get_alias(self, function_name: str) -> aws.lambda_.Alias:
        """
        Get a Lambda alias by function name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Lambda Alias resource
        """
        if function_name not in self.aliases:
            raise ValueError(f"Alias for function '{function_name}' not found")
        return self.aliases[function_name]
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get the log group name for a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Log group name as Output[str]
        """
        if function_name not in self.log_groups:
            raise ValueError(f"Log group for function '{function_name}' not found")
        return self.log_groups[function_name].name

