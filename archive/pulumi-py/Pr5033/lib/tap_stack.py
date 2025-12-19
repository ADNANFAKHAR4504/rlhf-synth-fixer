"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless file processing solution.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import ServerlessConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.notifications import NotificationsStack
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
        self.environment_suffix = environment_suffix or 'prod'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless file processing solution.

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
        provider = self.provider_manager.get_provider()
        
        # Initialize storage stack (S3 bucket)
        self.storage_stack = StorageStack(self.config, provider, self)
        
        # Initialize notifications stack (SNS topic)
        self.notifications_stack = NotificationsStack(self.config, provider, self)
        
        # Initialize IAM stack
        self.iam_stack = IAMStack(self.config, provider, self)
        
        # Initialize Lambda stack
        self.lambda_stack = LambdaStack(
            self.config,
            provider,
            self.iam_stack.get_lambda_role_arn(),
            self.storage_stack.get_bucket_name(),
            self.storage_stack.get_bucket_arn(),
            self.notifications_stack.get_topic_arn(),
            self
        )
        
        # Initialize monitoring stack
        self.monitoring_stack = MonitoringStack(
            self.config,
            provider,
            self.lambda_stack.get_function_name(),
            self.notifications_stack.get_topic_arn(),
            self
        )
        
        # Attach IAM policies after resources are created
        self._attach_iam_policies()
        
        # Initialize API Gateway stack
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            provider,
            self.lambda_stack.get_function_arn(),
            self.lambda_stack.get_function_name(),
            self
        )
        
        # Register outputs
        self._register_outputs()

    def _attach_iam_policies(self):
        """Attach necessary IAM policies to Lambda execution role."""
        # Attach CloudWatch Logs policy
        self.iam_stack.attach_cloudwatch_logs_policy(
            self.monitoring_stack.get_log_group_arn()
        )
        
        # Attach S3 policy
        self.iam_stack.attach_s3_policy(
            self.storage_stack.get_bucket_arn()
        )
        
        # Attach SNS policy
        if self.config.enable_notifications:
            self.iam_stack.attach_sns_policy(
                self.notifications_stack.get_topic_arn()
            )

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        # Configuration outputs
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['primary_region'] = self.config.primary_region
        
        # S3 bucket outputs
        outputs['bucket_name'] = self.storage_stack.get_bucket_name()
        outputs['bucket_arn'] = self.storage_stack.get_bucket_arn()
        
        # Lambda function outputs
        outputs['lambda_function_name'] = self.lambda_stack.get_function_name()
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn()
        outputs['lambda_role_arn'] = self.iam_stack.get_lambda_role_arn()
        
        # SNS topic outputs
        if self.config.enable_notifications:
            outputs['sns_topic_arn'] = self.notifications_stack.get_topic_arn()
        
        # CloudWatch outputs
        outputs['log_group_name'] = self.monitoring_stack.get_log_group_name()
        outputs['log_group_arn'] = self.monitoring_stack.get_log_group_arn()
        
        # API Gateway outputs
        outputs['api_gateway_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_rest_api_id()
        
        # Register component outputs
        self.register_outputs(outputs)
        
        # Export outputs to stack level with error handling for test environments
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            # Gracefully handle test environments where pulumi.export may not be available
            pulumi.log.warn(f"Failed to export outputs: {str(e)}")
