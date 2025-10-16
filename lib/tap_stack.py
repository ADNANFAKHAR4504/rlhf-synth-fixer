"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the serverless event processing pipeline.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure components
from infrastructure.config import PipelineConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.eventbridge import EventBridgeStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless event processing pipeline.

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
        self.config = PipelineConfig()
        
        # Initialize AWS provider manager
        self.provider_manager = AWSProviderManager(self.config)
        
        # Initialize infrastructure components
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(self.config, self.provider_manager, self.iam_stack, self.dynamodb_stack)
        self.eventbridge_stack = EventBridgeStack(self.config, self.provider_manager, self.lambda_stack)
        self.cloudwatch_stack = CloudWatchStack(self.config, self.provider_manager, self.lambda_stack, self.dynamodb_stack)
        
        # Register outputs
        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}
        
        # Lambda function outputs (with both region code and primary/secondary aliases)
        for region in self.config.regions:
            region_key = 'primary' if region == self.config.primary_region else 'secondary'
            outputs[f'lambda_function_arn_{region}'] = self.lambda_stack.get_function_arn(region)
            outputs[f'lambda_function_arn_{region_key}'] = self.lambda_stack.get_function_arn(region)
            outputs[f'lambda_function_name_{region}'] = self.lambda_stack.get_function_name(region)
            outputs[f'lambda_function_name_{region_key}'] = self.lambda_stack.get_function_name(region)
        
        # DynamoDB outputs (with both region code and primary/secondary aliases)
        for region in self.config.regions:
            region_key = 'primary' if region == self.config.primary_region else 'secondary'
            outputs[f'dynamodb_table_arn_{region}'] = self.dynamodb_stack.get_table_arn(region)
            outputs[f'dynamodb_table_arn_{region_key}'] = self.dynamodb_stack.get_table_arn(region)
            outputs[f'dynamodb_table_name_{region}'] = self.dynamodb_stack.get_table_name(region)
            outputs[f'dynamodb_table_name_{region_key}'] = self.dynamodb_stack.get_table_name(region)
        
        # Add global table ARN if available
        if self.dynamodb_stack.global_table:
            outputs['dynamodb_global_table_arn'] = self.dynamodb_stack.get_global_table_arn()
        
        # EventBridge outputs (with both region code and primary/secondary aliases)
        for region in self.config.regions:
            region_key = 'primary' if region == self.config.primary_region else 'secondary'
            outputs[f'eventbridge_bus_arn_{region}'] = self.eventbridge_stack.get_event_bus_arn(region)
            outputs[f'eventbridge_bus_arn_{region_key}'] = self.eventbridge_stack.get_event_bus_arn(region)
            outputs[f'eventbridge_bus_name_{region}'] = self.eventbridge_stack.get_event_bus_name(region)
            outputs[f'eventbridge_bus_name_{region_key}'] = self.eventbridge_stack.get_event_bus_name(region)
            outputs[f'eventbridge_rule_arn_{region}'] = self.eventbridge_stack.get_rule_arn(region)
            outputs[f'eventbridge_rule_arn_{region_key}'] = self.eventbridge_stack.get_rule_arn(region)
        
        # CloudWatch outputs (with both region code and primary/secondary aliases)
        for region in self.config.regions:
            region_key = 'primary' if region == self.config.primary_region else 'secondary'
            outputs[f'sns_topic_arn_{region}'] = self.cloudwatch_stack.get_sns_topic_arn(region)
            outputs[f'sns_topic_arn_{region_key}'] = self.cloudwatch_stack.get_sns_topic_arn(region)
        
        # Configuration outputs
        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_region'] = self.config.secondary_region
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        
        # Register outputs
        self.register_outputs(outputs)
        
        # Export outputs to stack level for integration tests
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            # Handle cases where pulumi.export might not be available (e.g., in tests)
            pass
