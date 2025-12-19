"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless infrastructure project.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure modules
from infrastructure.config import InfrastructureConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_function import LambdaStack
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
        aws_region (Optional[str]): AWS region for deployment.
    """

    def __init__(self, environment_suffix: Optional[str] = None, 
                 tags: Optional[dict] = None, aws_region: Optional[str] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags
        self.aws_region = aws_region


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless infrastructure.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.

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

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        self.aws_region = args.aws_region or 'us-east-1'

        # Create AWS provider with explicit region
        self.aws_provider = Provider(
            f"aws-provider-{self.environment_suffix}",
            region=self.aws_region,
            opts=ResourceOptions(parent=self)
        )

        # Initialize configuration
        self.config = InfrastructureConfig(environment_suffix=self.environment_suffix)

        # Create infrastructure components
        self._create_infrastructure_components()

        # Register outputs
        self._register_outputs()

    def _create_infrastructure_components(self):
        """Create all infrastructure components in the correct order."""
        # Create IAM stack first (required by other components)
        self.iam_stack = IAMStack(
            config=self.config,
            provider=self.aws_provider
        )

        # Create DynamoDB stack
        self.dynamodb_stack = DynamoDBStack(
            config=self.config,
            provider=self.aws_provider
        )

        # Create Lambda stack (depends on IAM)
        self.lambda_stack = LambdaStack(
            config=self.config,
            iam_outputs=self.iam_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create API Gateway stack (depends on Lambda)
        self.api_gateway_stack = APIGatewayStack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create S3 stack (depends on Lambda for event notifications)
        self.s3_stack = S3Stack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create CloudWatch stack (depends on Lambda and API Gateway)
        self.cloudwatch_stack = CloudWatchStack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            api_gateway_outputs=self.api_gateway_stack.get_outputs(),
            provider=self.aws_provider
        )

    def _register_outputs(self):
        """Register all stack outputs for integration testing."""
        # Collect outputs from all components
        all_outputs = {
            # Configuration outputs
            "environment_suffix": self.environment_suffix,
            "aws_region": self.aws_region,
            "project_name": self.config.project_name,
            
            # IAM outputs
            **self.iam_stack.get_outputs(),
            
            # Lambda outputs
            **self.lambda_stack.get_outputs(),
            
            # API Gateway outputs
            **self.api_gateway_stack.get_outputs(),
            
            # DynamoDB outputs
            **self.dynamodb_stack.get_outputs(),
            
            # S3 outputs
            **self.s3_stack.get_outputs(),
            
            # CloudWatch outputs
            **self.cloudwatch_stack.get_outputs()
        }

        # Register outputs
        self.register_outputs(all_outputs)
