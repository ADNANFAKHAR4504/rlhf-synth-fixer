"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless transaction processing infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, DynamoDBStack,
                             IAMStack, KMSStack, LambdaStack, MonitoringStack,
                             S3Stack, SQSStack, TransactionConfig)


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
    Represents the main Pulumi component resource for the serverless transaction processing infrastructure.
    
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
        
        self.config = TransactionConfig()
        
        self.provider_manager = AWSProviderManager(self.config)
        
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        self.s3_stack = S3Stack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.dynamodb_stack = DynamoDBStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.sqs_stack = SQSStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )
        
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack
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
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        
        outputs['logs_bucket_name'] = self.s3_stack.get_bucket_name('logs')
        outputs['logs_bucket_arn'] = self.s3_stack.get_bucket_arn('logs')
        
        outputs['transactions_table_name'] = self.dynamodb_stack.get_table_name('transactions')
        outputs['transactions_table_arn'] = self.dynamodb_stack.get_table_arn('transactions')
        
        outputs['analytics_queue_url'] = self.sqs_stack.get_queue_url('analytics')
        outputs['analytics_queue_arn'] = self.sqs_stack.get_queue_arn('analytics')
        outputs['reporting_queue_url'] = self.sqs_stack.get_queue_url('reporting')
        outputs['reporting_queue_arn'] = self.sqs_stack.get_queue_arn('reporting')
        
        outputs['analytics_dlq_url'] = self.sqs_stack.get_dlq_url('analytics-dlq')
        outputs['reporting_dlq_url'] = self.sqs_stack.get_dlq_url('reporting-dlq')
        
        outputs['transaction_validator_function_name'] = self.lambda_stack.get_function_name('transaction-validator')
        outputs['transaction_validator_function_arn'] = self.lambda_stack.get_function_arn('transaction-validator')
        outputs['transaction_validator_log_group'] = self.lambda_stack.get_log_group_name('transaction-validator')
        outputs['transaction_validator_dlq_url'] = self.sqs_stack.get_dlq_url('transaction-validator-lambda')
        
        outputs['notification_handler_function_name'] = self.lambda_stack.get_function_name('notification-handler')
        outputs['notification_handler_function_arn'] = self.lambda_stack.get_function_arn('notification-handler')
        outputs['notification_handler_log_group'] = self.lambda_stack.get_log_group_name('notification-handler')
        outputs['notification_handler_dlq_url'] = self.sqs_stack.get_dlq_url('notification-handler-lambda')
        
        outputs['analytics_processor_function_name'] = self.lambda_stack.get_function_name('analytics-processor')
        outputs['analytics_processor_function_arn'] = self.lambda_stack.get_function_arn('analytics-processor')
        outputs['analytics_processor_log_group'] = self.lambda_stack.get_log_group_name('analytics-processor')
        outputs['analytics_processor_dlq_url'] = self.sqs_stack.get_dlq_url('analytics-processor-lambda')
        
        outputs['reporting_processor_function_name'] = self.lambda_stack.get_function_name('reporting-processor')
        outputs['reporting_processor_function_arn'] = self.lambda_stack.get_function_arn('reporting-processor')
        outputs['reporting_processor_log_group'] = self.lambda_stack.get_log_group_name('reporting-processor')
        outputs['reporting_processor_dlq_url'] = self.sqs_stack.get_dlq_url('reporting-processor-lambda')
        
        outputs['kms_s3_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['kms_s3_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['kms_dynamodb_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['kms_dynamodb_key_arn'] = self.kms_stack.get_key_arn('dynamodb')
        outputs['kms_sqs_key_id'] = self.kms_stack.get_key_id('sqs')
        outputs['kms_sqs_key_arn'] = self.kms_stack.get_key_arn('sqs')
        
        outputs['alarms_sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()
        
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

        self.register_outputs(outputs)
