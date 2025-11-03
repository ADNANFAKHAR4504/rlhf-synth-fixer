"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless payment processing architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import PaymentProcessingConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.sqs import SQSStack
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
    Represents the main Pulumi component resource for the serverless payment processing system.

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

        self.config = PaymentProcessingConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack
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

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_stage_name'] = self.api_gateway_stack.get_stage_name()

        outputs['payments_table_name'] = self.dynamodb_stack.get_table_name('payments')
        outputs['payments_table_arn'] = self.dynamodb_stack.get_table_arn('payments')

        outputs['lambda_function_arn_payment_processor'] = self.lambda_stack.get_function_arn('payment-processor')
        outputs['lambda_function_name_payment_processor'] = self.lambda_stack.get_function_name('payment-processor')
        outputs['lambda_function_invoke_arn_payment_processor'] = self.lambda_stack.get_function_invoke_arn('payment-processor')

        outputs['log_group_name_payment_processor'] = self.lambda_stack.get_log_group_name('payment-processor')
        outputs['log_group_arn_payment_processor'] = self.lambda_stack.get_log_group_arn('payment-processor')

        outputs['payment_processor_dlq_url'] = self.sqs_stack.get_queue_url('payment-processor-dlq')
        outputs['payment_processor_dlq_arn'] = self.sqs_stack.get_queue_arn('payment-processor-dlq')

        outputs['payment_processor_role_arn'] = self.iam_stack.get_role_arn('payment-processor')

        outputs['error_rate_alarm_arn'] = self.monitoring_stack.get_alarm_arn('payment-processor-error-rate')
        outputs['throttle_alarm_arn'] = self.monitoring_stack.get_alarm_arn('payment-processor-throttle')
        outputs['duration_alarm_arn'] = self.monitoring_stack.get_alarm_arn('payment-processor-duration')

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name
        outputs['application'] = self.config.application
        outputs['cost_center'] = self.config.cost_center
        outputs['lambda_memory_size'] = str(self.config.lambda_memory_size)
        outputs['lambda_timeout'] = str(self.config.lambda_timeout)
        outputs['lambda_reserved_concurrency'] = str(self.config.lambda_reserved_concurrency)

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

    def get_table_name(self, table_name: str) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name(table_name)

    def get_table_arn(self, table_name: str) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn(table_name)
