"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless backend architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import ServerlessConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.parameter_store import ParameterStoreStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless backend.

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

        # Initialize configuration
        self.config = ServerlessConfig()

        # Initialize AWS provider manager
        self.provider_manager = AWSProviderManager(self.config)

        # Initialize infrastructure components in dependency order
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.parameter_store_stack = ParameterStoreStack(self.config, self.provider_manager)
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.parameter_store_stack
        )
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )

        # Register outputs
        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        # Lambda function outputs
        for function_name in self.lambda_stack.get_all_function_names():
            outputs[f'lambda_function_arn_{function_name}'] = self.lambda_stack.get_function_arn(function_name)
            outputs[f'lambda_function_name_{function_name}'] = self.lambda_stack.get_function_name(function_name)

        # S3 bucket outputs
        outputs['s3_static_bucket_name'] = self.storage_stack.get_bucket_name('static')
        outputs['s3_static_bucket_arn'] = self.storage_stack.get_bucket_arn('static')
        outputs['s3_uploads_bucket_name'] = self.storage_stack.get_bucket_name('uploads')
        outputs['s3_uploads_bucket_arn'] = self.storage_stack.get_bucket_arn('uploads')

        # API Gateway outputs for each stage
        for stage_name in self.api_gateway_stack.get_all_stage_names():
            outputs[f'api_url_{stage_name}'] = self.api_gateway_stack.get_api_url(stage_name)
            outputs[f'api_id_{stage_name}'] = self.api_gateway_stack.get_api(stage_name).id

        # CloudWatch outputs
        for function_name in self.lambda_stack.get_all_function_names():
            outputs[f'log_group_name_{function_name}'] = self.monitoring_stack.get_log_group_name(function_name)

        # Configuration outputs
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['project_name'] = self.config.project_name

        # Register component outputs
        self.register_outputs(outputs)
        
        # Export outputs to stack level for integration tests
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            # Handle cases where pulumi.export might not be available (e.g., in tests)
            pass

    def get_lambda_function_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function ARN.

        Args:
            function_name: Function name identifier

        Returns:
            Function ARN as Output
        """
        return self.lambda_stack.get_function_arn(function_name)

    def get_lambda_function_name(self, function_name: str) -> Output[str]:
        """
        Get Lambda function name.

        Args:
            function_name: Function name identifier

        Returns:
            Function name as Output
        """
        return self.lambda_stack.get_function_name(function_name)

    def get_api_url(self, stage_name: str) -> Output[str]:
        """
        Get API Gateway URL for a stage.

        Args:
            stage_name: Stage name

        Returns:
            API URL as Output
        """
        return self.api_gateway_stack.get_api_url(stage_name)

    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """
        Get S3 bucket name.

        Args:
            bucket_type: Bucket type ('static' or 'uploads')

        Returns:
            Bucket name as Output
        """
        return self.storage_stack.get_bucket_name(bucket_type)
