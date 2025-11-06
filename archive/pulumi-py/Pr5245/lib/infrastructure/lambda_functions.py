"""
Lambda Functions module for the serverless transaction pipeline.

This module creates Lambda functions with proper IAM roles, environment variables,
and concurrency limits.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import AssetArchive, FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions for the transaction pipeline.
    
    Creates three Lambda functions with proper configuration.
    """
    
    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: TransactionPipelineConfig instance
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
        
        self._create_transaction_receiver()
        self._create_fraud_validator()
        self._create_audit_logger()
    
    def _get_lambda_code_path(self, function_name: str) -> str:
        """Get the path to Lambda function code."""
        current_dir = os.path.dirname(__file__)
        return os.path.join(current_dir, 'lambda_code', f'{function_name}.py')
    
    def _create_transaction_receiver(self):
        """Create transaction-receiver Lambda function."""
        function_name = 'transaction-receiver'
        
        default_event_bus_arn = f"arn:aws:events:{self.config.primary_region}:*:event-bus/default"
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('transactions')],
            eventbridge_bus_arns=[default_event_bus_arn],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='transaction_receiver.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'TRANSACTIONS_TABLE': self.dynamodb_stack.get_table_name('transactions'),
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def _create_fraud_validator(self):
        """Create fraud-validator Lambda function."""
        function_name = 'fraud-validator'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('validation-results')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('failed-validations')],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='fraud_validator.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'VALIDATION_RESULTS_TABLE': self.dynamodb_stack.get_table_name('validation-results'),
                    'FAILED_VALIDATIONS_QUEUE_URL': self.sqs_stack.get_queue_url('failed-validations'),
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def _create_audit_logger(self):
        """Create audit-logger Lambda function."""
        function_name = 'audit-logger'
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('audit-logger')],
            enable_xray=self.config.enable_xray_tracing
        )
        
        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='audit_logger.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        aws.lambda_.EventSourceMapping(
            f"{function_name}-sqs-trigger",
            event_source_arn=self.sqs_stack.get_queue_arn('audit-logger'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[function]
            )
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get a Lambda function by name."""
        return self.functions[function_name]
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_name].arn
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_name].name
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_name].invoke_arn
    
    def get_all_function_names(self):
        """Get all function names."""
        return list(self.functions.keys())

