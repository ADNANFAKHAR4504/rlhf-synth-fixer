"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless application.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure components
from infrastructure.config import InfrastructureConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_function import LambdaStack
from infrastructure.logging import LoggingStack
from infrastructure.s3 import S3Stack
from pulumi import ResourceOptions
from pulumi_aws import Provider


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment 
            environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        config (Optional[dict]): Optional configuration dictionary.
    """

    def __init__(
        self, 
        environment_suffix: Optional[str] = None, 
        tags: Optional[dict] = None,
        config: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.config = config or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless application.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment configuration with comprehensive outputs for integration testing.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        # Initialize configuration
        self.config = InfrastructureConfig(args.config)
        
        # Override environment suffix if provided
        if args.environment_suffix:
            self.config.environment = args.environment_suffix
            self.config.name_prefix = f"{self.config.project_name}-{args.environment_suffix}"
        
        # Merge tags
        self.tags = {**self.config.tags, **args.tags}
        
        # Create AWS provider with region enforcement
        self.aws_provider = Provider(
            "aws-provider",
            region=self.config.aws_region,
            opts=ResourceOptions(parent=self)
        )
        
        # Initialize infrastructure components
        self.iam_stack = IAMStack(
            self.config,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        self.s3_stack = S3Stack(
            self.config,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.iam_stack,
            self.s3_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.lambda_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        self.cloudwatch_stack = CloudWatchStack(
            self.config,
            self.lambda_stack,
            self.api_gateway_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        self.logging_stack = LoggingStack(
            self.config,
            self.s3_stack,
            self.cloudwatch_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )
        
        # Register comprehensive outputs for integration testing
        self.register_outputs({
            # Environment and configuration
            "environment": self.config.environment,
            "aws_region": self.config.aws_region,
            "project_name": self.config.project_name,
            
            # Lambda function outputs
            "lambda_function_name": self.lambda_stack.get_main_function_name(),
            "lambda_function_arn": self.lambda_stack.get_main_function_arn(),
            "lambda_function_invoke_arn": self.lambda_stack.get_main_function_invoke_arn(),
            "log_processor_function_name": self.lambda_stack.get_log_processor_function_name(),
            "log_processor_function_arn": self.lambda_stack.get_log_processor_function_arn(),
            
            # API Gateway outputs
            "api_gateway_id": self.api_gateway_stack.get_rest_api_id(),
            "api_gateway_arn": self.api_gateway_stack.get_rest_api_arn(),
            "api_gateway_invoke_url": self.api_gateway_stack.get_invoke_url(),
            "api_gateway_execution_arn": self.api_gateway_stack.get_execution_arn(),
            
            # S3 bucket outputs
            "s3_bucket_name": self.s3_stack.get_logs_bucket_name(),
            "s3_bucket_arn": self.s3_stack.get_logs_bucket_arn(),
            "s3_bucket_domain_name": self.s3_stack.get_logs_bucket_domain_name(),
            
            # IAM role outputs
            "lambda_execution_role_arn": self.iam_stack.get_lambda_execution_role_arn(),
            "api_gateway_role_arn": self.iam_stack.get_api_gateway_role_arn(),
            "log_processing_role_arn": self.iam_stack.get_log_processing_role_arn(),
            
            # CloudWatch outputs
            "cloudwatch_dashboard_url": self.cloudwatch_stack.get_dashboard_url(),
            
            # Log group outputs
            "main_log_group_name": self.cloudwatch_stack.get_log_groups()['main'].name,
            "processor_log_group_name": self.cloudwatch_stack.get_log_groups()['processor'].name,
            "api_log_group_name": self.cloudwatch_stack.get_log_groups()['api'].name,
        })
