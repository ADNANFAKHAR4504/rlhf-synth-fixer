"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless financial data processing pipeline architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import FinancialDataPipelineConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
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
    Represents the main Pulumi component resource for the serverless financial data pipeline.

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

        self.config = FinancialDataPipelineConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.storage_stack
        )
        
        self.lambda_stack.setup_s3_trigger(self.storage_stack.get_bucket_arn())
        
        self.storage_stack.setup_event_notification(
            self.lambda_stack.get_function_arn('processor')
        )
        
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack,
            self.dynamodb_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()

        outputs['market_data_table_name'] = self.dynamodb_stack.get_table_name()
        outputs['market_data_table_arn'] = self.dynamodb_stack.get_table_arn()

        outputs['data_bucket_name'] = self.storage_stack.get_bucket_name()
        outputs['data_bucket_arn'] = self.storage_stack.get_bucket_arn()

        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'lambda_function_arn_{safe_name}'] = (
                self.lambda_stack.get_function_arn(function_name)
            )
            outputs[f'lambda_function_name_{safe_name}'] = (
                self.lambda_stack.get_function_name(function_name)
            )

        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'log_group_name_{safe_name}'] = (
                self.monitoring_stack.get_log_group_name(function_name)
            )
            outputs[f'log_group_arn_{safe_name}'] = (
                self.monitoring_stack.get_log_group_arn(function_name)
            )
        
        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'{safe_name}_dlq_url'] = self.sqs_stack.get_dlq_url(function_name)
            outputs[f'{safe_name}_dlq_arn'] = self.sqs_stack.get_dlq_arn(function_name)
        
        outputs['api_stage_name'] = self.config.environment
        outputs['api_deployment_id'] = self.api_gateway_stack.deployment.id

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

    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
        return self.api_gateway_stack.get_api_url()

    def get_lambda_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn(function_name)

    def get_lambda_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name(function_name)

    def get_table_name(self) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name()

    def get_table_arn(self) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn()
    
    def get_bucket_name(self) -> Output[str]:
        """Get S3 bucket name."""
        return self.storage_stack.get_bucket_name()
    
    def get_bucket_arn(self) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.storage_stack.get_bucket_arn()
