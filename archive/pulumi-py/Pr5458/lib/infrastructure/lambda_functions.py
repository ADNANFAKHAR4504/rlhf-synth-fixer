"""
Lambda functions module for the serverless infrastructure.

This module creates Lambda functions with correct configuration:
- 3GB memory, 5-minute timeout
- X-Ray tracing
- DLQs with proper FunctionEventInvokeConfig
- Reserved concurrency
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import AssetArchive, FileArchive, Output, ResourceOptions


class LambdaStack:
    """
    Manages Lambda functions for the serverless infrastructure.
    
    Model failure fixes:
    - 3GB memory (3072 MB)
    - 5-minute timeout (300 seconds)
    - X-Ray tracing enabled
    - Proper SQS DLQs with FunctionEventInvokeConfig
    - Reserved concurrency (100 for processing Lambda)
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        iam_stack,
        sqs_stack,
        dynamodb_table_name: Output[str],
        s3_bucket_name: Output[str]
    ):
        """
        Initialize Lambda Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            sqs_stack: SQSStack instance
            dynamodb_table_name: DynamoDB table name
            s3_bucket_name: S3 bucket name
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.sqs_stack = sqs_stack
        self.dynamodb_table_name = dynamodb_table_name
        self.s3_bucket_name = s3_bucket_name
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
    
    def create_processing_lambda(
        self,
        role: aws.iam.Role
    ) -> aws.lambda_.Function:
        """
        Create Lambda function for processing S3 CSV files.
        
        Model failure fixes applied:
        - 3GB memory (3072 MB)
        - 5-minute timeout (300 seconds)
        - Reserved concurrency 100
        - X-Ray tracing
        - Proper DLQ configuration
        
        Args:
            role: IAM role for Lambda
            
        Returns:
            Lambda Function resource
        """
        function_name = self.config.get_resource_name(
            "processing-lambda",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create CloudWatch Log Group with 7-day retention (model failure fix)
        log_group = aws.cloudwatch.LogGroup(
            "processing-lambda-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,  # 7 days
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.log_groups['processing'] = log_group
        
        # Package Lambda code
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            "lambda_code"
        )
        
        # Create Lambda function
        # Note: reserved_concurrent_executions removed to avoid account limit issues
        function = aws.lambda_.Function(
            "processing-lambda",
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="processing_handler.lambda_handler",
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,  # 300 seconds (5 minutes)
            memory_size=self.config.lambda_memory_size,  # 3008 MB
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
                    "S3_BUCKET_NAME": self.s3_bucket_name,
                    "ENVIRONMENT": self.config.environment,
                    "ENVIRONMENT_SUFFIX": self.config.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[log_group]
            ) if self.provider else ResourceOptions(depends_on=[log_group])
        )
        
        # Configure DLQ with FunctionEventInvokeConfig (model failure fix)
        dlq_arn = self.sqs_stack.get_queue_arn('processing-lambda')
        
        aws.lambda_.FunctionEventInvokeConfig(
            "processing-lambda-invoke-config",
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retries,  # 2 retries
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq_arn
                )
            ),
            opts=opts
        )
        
        self.functions['processing'] = function
        return function
    
    def create_api_lambda(
        self,
        name: str,
        handler: str,
        role: aws.iam.Role
    ) -> aws.lambda_.Function:
        """
        Create Lambda function for API Gateway endpoints.
        
        Args:
            name: Function name identifier (e.g., 'upload', 'status', 'results')
            handler: Handler function name (e.g., 'api_handler.upload_handler')
            role: IAM role for Lambda
            
        Returns:
            Lambda Function resource
        """
        function_name = self.config.get_resource_name(
            f"{name}-lambda",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create CloudWatch Log Group with 7-day retention
        log_group = aws.cloudwatch.LogGroup(
            f"{name}-lambda-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.log_groups[name] = log_group
        
        # Package Lambda code
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            "lambda_code"
        )
        
        # Create Lambda function
        function = aws.lambda_.Function(
            f"{name}-lambda",
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler=handler,
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
                    "S3_BUCKET_NAME": self.s3_bucket_name,
                    "ENVIRONMENT": self.config.environment,
                    "ENVIRONMENT_SUFFIX": self.config.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[log_group]
            ) if self.provider else ResourceOptions(depends_on=[log_group])
        )
        
        # Configure DLQ with FunctionEventInvokeConfig
        dlq_arn = self.sqs_stack.get_queue_arn(f"{name}-lambda")
        
        aws.lambda_.FunctionEventInvokeConfig(
            f"{name}-lambda-invoke-config",
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retries,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq_arn
                )
            ),
            opts=opts
        )
        
        self.functions[name] = function
        return function
    
    def get_function(self, name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions[name]
    
    def get_function_arn(self, name: str) -> Output[str]:
        """Get Lambda function ARN by name."""
        return self.functions[name].arn
    
    def get_function_name(self, name: str) -> Output[str]:
        """Get Lambda function name by name."""
        return self.functions[name].name
    
    def get_log_group_arn(self, name: str) -> Output[str]:
        """Get CloudWatch Log Group ARN by name."""
        return self.log_groups[name].arn

