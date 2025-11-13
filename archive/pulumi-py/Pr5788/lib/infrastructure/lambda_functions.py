"""
Lambda functions module.

This module creates Lambda functions with proper configuration including
DLQs, X-Ray tracing, layers, and event invoke configs.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .sqs import SQSStack


class LambdaStack:
    """Manages Lambda functions with proper configuration."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_functions()
    
    def _create_functions(self):
        """Create Lambda functions."""
        self._create_transaction_validator()
        self._create_notification_handler()
        self._create_analytics_processor()
        self._create_reporting_processor()
    
    def _create_transaction_validator(self):
        """Create transaction validator Lambda function."""
        function_name = 'transaction-validator'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('transactions')],
            sqs_queue_arns=[
                self.sqs_stack.get_queue_arn('analytics'),
                self.sqs_stack.get_queue_arn('reporting')
            ],
            dlq_arn=self.sqs_stack.get_dlq_arn('transaction-validator-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('dynamodb'),
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )
        
        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'transaction_validator.py'
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='transaction_validator.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.transaction_validator_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'TRANSACTIONS_TABLE': self.dynamodb_stack.get_table_name('transactions'),
                    'ANALYTICS_QUEUE_URL': self.sqs_stack.get_queue_url('analytics'),
                    'REPORTING_QUEUE_URL': self.sqs_stack.get_queue_url('reporting'),
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('transaction-validator-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('transaction-validator-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        self.functions[function_name] = function
        self.log_groups[function_name] = log_group
    
    def _create_notification_handler(self):
        """Create notification handler Lambda function."""
        function_name = 'notification-handler'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            dlq_arn=self.sqs_stack.get_dlq_arn('notification-handler-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )
        
        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'notification_handler.py'
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='notification_handler.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:notifications',
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('notification-handler-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('notification-handler-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        self.functions[function_name] = function
        self.log_groups[function_name] = log_group
    
    def _create_analytics_processor(self):
        """Create analytics processor Lambda function."""
        function_name = 'analytics-processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('analytics')],
            dlq_arn=self.sqs_stack.get_dlq_arn('analytics-processor-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )
        
        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'analytics_processor.py'
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='analytics_processor.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('analytics-processor-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )
        
        aws.lambda_.EventSourceMapping(
            f'{function_name}-event-source',
            event_source_arn=self.sqs_stack.get_queue_arn('analytics'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('analytics-processor-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        self.functions[function_name] = function
        self.log_groups[function_name] = log_group
    
    def _create_reporting_processor(self):
        """Create reporting processor Lambda function."""
        function_name = 'reporting-processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('reporting')],
            dlq_arn=self.sqs_stack.get_dlq_arn('reporting-processor-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )
        
        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'reporting_processor.py'
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='reporting_processor.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('reporting-processor-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )
        
        aws.lambda_.EventSourceMapping(
            f'{function_name}-event-source',
            event_source_arn=self.sqs_stack.get_queue_arn('reporting'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('reporting-processor-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )
        
        self.functions[function_name] = function
        self.log_groups[function_name] = log_group
    
    def get_function_name(self, function_key: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_key].name
    
    def get_function_arn(self, function_key: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_key].arn
    
    def get_function_invoke_arn(self, function_key: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_key].invoke_arn
    
    def get_log_group_name(self, function_key: str) -> Output[str]:
        """Get CloudWatch log group name."""
        return self.log_groups[function_key].name
    
    def get_log_group_arn(self, function_key: str) -> Output[str]:
        """Get CloudWatch log group ARN."""
        return self.log_groups[function_key].arn
