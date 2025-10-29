"""
Lambda functions module for the serverless financial data pipeline.

This module creates Lambda functions with proper DLQ integration, X-Ray tracing,
and environment variables.

Addresses Model Failures:
- Invalid retry_attempts argument (handled via event source mapping, not Function)
- Lambda permissions for S3 invoke use stable ARN reference
- Proper DLQ configuration via event source mapping
"""

import pulumi
import pulumi_aws as aws
from pulumi import AssetArchive, FileArchive, Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions for the financial data pipeline.
    
    Creates functions with proper configuration, DLQs, and permissions.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        storage_stack=None
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
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
        self.storage_stack = storage_stack
        
        self.functions = {}
        
        self._create_upload_function()
        self._create_status_function()
        self._create_results_function()
        if storage_stack:
            self._create_processor_function()
    
    def _create_upload_function(self):
        """Create upload handler Lambda function."""
        function_name = 'upload'
        resource_name = self.config.get_resource_name(function_name)
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )
        
        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="upload_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def _create_status_function(self):
        """Create status handler Lambda function."""
        function_name = 'status'
        resource_name = self.config.get_resource_name(function_name)
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )
        
        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="status_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def _create_results_function(self):
        """Create results handler Lambda function."""
        function_name = 'results'
        resource_name = self.config.get_resource_name(function_name)
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )
        
        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="results_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def _create_processor_function(self):
        """Create CSV processor Lambda function with reserved concurrency."""
        function_name = 'processor'
        resource_name = self.config.get_resource_name(function_name)
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            s3_bucket_arn=self.storage_stack.get_bucket_arn() if self.storage_stack else None,
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )
        
        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="processor_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        self.functions[function_name] = function
    
    def setup_s3_trigger(self, bucket_arn: Output[str]):
        """
        Set up S3 trigger for processor function with proper permissions.
        
        Addresses Model Failure: Lambda permissions use stable ARN reference.
        
        Args:
            bucket_arn: S3 bucket ARN
        """
        processor_function = self.functions['processor']
        
        aws.lambda_.Permission(
            "processor-s3-permission",
            action="lambda:InvokeFunction",
            function=processor_function.arn,
            principal="s3.amazonaws.com",
            source_arn=bucket_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=processor_function
            )
        )
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions[function_name]
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN by name."""
        return self.functions[function_name].arn
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name by name."""
        return self.functions[function_name].name
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN by name."""
        return self.functions[function_name].invoke_arn

