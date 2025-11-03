"""
Lambda Functions module for the serverless payment processing system.

This module creates Lambda functions with proper IAM roles, environment variables,
DLQ configuration, and concurrency limits.

"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import PaymentProcessingConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions for the payment processing system.
    
    Creates the consolidated payment processor Lambda with proper configuration.
    """
    
    def __init__(
        self,
        config: PaymentProcessingConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: PaymentProcessingConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        
        self._create_payment_processor()
    
    def _get_lambda_code_path(self) -> str:
        """Get the path to Lambda function code directory."""
        current_dir = os.path.dirname(__file__)
        return os.path.join(current_dir, 'lambda_code')
    
    def _create_payment_processor(self):
        """
        Create payment-processor Lambda function.
        
        This is the consolidated function that handles validation, processing,
        and notification with proper DLQ attachment.
        """
        function_name = 'payment-processor'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn('payments'),
            sqs_queue_arn=self.sqs_stack.get_queue_arn('payment-processor-dlq'),
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.log_groups[function_name] = log_group
        
        code_path = self._get_lambda_code_path()
        
        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='payment_processor.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'PAYMENTS_TABLE_NAME': self.dynamodb_stack.get_table_name('payments'),
                    'DLQ_URL': self.sqs_stack.get_queue_url('payment-processor-dlq')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('payment-processor-dlq')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get a function by name."""
        return self.functions.get(function_name)
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get a function name by identifier."""
        function = self.functions.get(function_name)
        if function:
            return function.name
        return Output.from_input("")
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get a function ARN by identifier."""
        function = self.functions.get(function_name)
        if function:
            return function.arn
        return Output.from_input("")
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get a function invoke ARN by identifier."""
        function = self.functions.get(function_name)
        if function:
            return function.invoke_arn
        return Output.from_input("")
    
    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """Get a log group by function name."""
        return self.log_groups.get(function_name)
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get a log group name by function name."""
        log_group = self.log_groups.get(function_name)
        if log_group:
            return log_group.name
        return Output.from_input("")
    
    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get a log group ARN by function name."""
        log_group = self.log_groups.get(function_name)
        if log_group:
            return log_group.arn
        return Output.from_input("")

