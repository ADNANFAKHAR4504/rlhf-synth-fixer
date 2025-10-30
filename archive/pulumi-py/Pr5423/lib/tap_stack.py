"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the multi-environment infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import MultiEnvConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.eventbridge import EventBridgeStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.sqs import SQSStack
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
        self.environment_suffix = environment_suffix or 'pr1234'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the multi-environment infrastructure.

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

        self.config = MultiEnvConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.dynamodb_stack,
            self.sqs_stack
        )
        self.eventbridge_stack = EventBridgeStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack,
            self.sqs_stack,
            self.storage_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['bucket_name'] = self.storage_stack.get_bucket_name('data')
        outputs['bucket_arn'] = self.storage_stack.get_bucket_arn('data')

        outputs['dynamodb_table_name'] = self.dynamodb_stack.get_table_name('items')
        outputs['dynamodb_table_arn'] = self.dynamodb_stack.get_table_arn('items')

        outputs['lambda_function_name'] = self.lambda_stack.get_function_name('process-data')
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn('process-data')

        outputs['eventbridge_rule_arn'] = self.eventbridge_stack.get_rule_arn('s3-object-created')

        outputs['dlq_url'] = self.sqs_stack.get_dlq_url('eventbridge')
        outputs['dlq_arn'] = self.sqs_stack.get_dlq_arn('eventbridge')

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

    def get_bucket_name(self) -> Output[str]:
        """Get S3 bucket name."""
        return self.storage_stack.get_bucket_name('data')

    def get_bucket_arn(self) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.storage_stack.get_bucket_arn('data')

    def get_table_name(self) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name('items')

    def get_table_arn(self) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn('items')

    def get_lambda_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name('process-data')

    def get_lambda_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn('process-data')
