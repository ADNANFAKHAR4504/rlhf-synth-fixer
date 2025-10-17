"""
Lambda module for the serverless infrastructure.

This module creates Lambda functions with X-Ray tracing, proper environment variables,
and explicit log group configuration, addressing the model failures about missing
log group setup and environment variable configuration.
"""

from typing import Any, Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import AssetArchive, FileAsset, ResourceOptions

from .config import InfrastructureConfig


class LambdaStack:
    """
    Lambda stack for managing serverless functions.
    
    Creates Lambda functions with:
    - X-Ray tracing enabled
    - Proper environment variables
    - Explicit log group configuration
    - Deterministic packaging
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        iam_stack,
        s3_stack,
        dynamodb_stack,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: Infrastructure configuration
            iam_stack: IAM stack for roles
            s3_stack: S3 stack for deployment packages
            dynamodb_stack: DynamoDB stack for table references
            opts: Pulumi resource options
        """
        self.config = config
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.dynamodb_stack = dynamodb_stack
        self.opts = opts or ResourceOptions()
        
        # Create main API handler Lambda function
        self.api_handler = self._create_api_handler()
        
        # Create data processor Lambda function
        self.data_processor = self._create_data_processor()
        
        # Create error handler Lambda function
        self.error_handler = self._create_error_handler()
    
    def _create_api_handler(self):
        """Create the main API handler Lambda function."""
        function_name = f"{self.config.get_resource_name('lambda-function', 'api-handler')}-{self.config.environment}"
        
        # Create explicit log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create deployment package
        code_archive = AssetArchive({
            "index.py": FileAsset("./lib/infrastructure/lambda_code/api_handler/index.py")
        })
        
        # Environment variables with proper configuration
        environment_vars = {
            **self.config.get_lambda_config()['environment'],
            'DYNAMODB_TABLE_NAME': self.dynamodb_stack.get_main_table_name(),
            'DYNAMODB_AUDIT_TABLE_NAME': self.dynamodb_stack.get_audit_table_name(),
            'S3_BUCKET_NAME': self.s3_stack.get_static_assets_bucket_name(),
            'LOG_LEVEL': 'INFO'
        }
        
        # Create the Lambda function
        function = aws.lambda_.Function(
            function_name,
            code=code_archive,
            handler="index.handler",
            runtime=self.config.lambda_runtime,
            role=self.iam_stack.lambda_execution_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=environment_vars
            ),
            # Enable X-Ray tracing
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.tags,
            opts=ResourceOptions(
                parent=self.opts.parent, 
                provider=self.opts.provider,
                depends_on=[log_group]
            )
        )
        
        return function
    
    def _create_data_processor(self):
        """Create the data processor Lambda function."""
        function_name = f"{self.config.get_resource_name('lambda-function', 'data-processor')}-{self.config.environment}"
        
        # Create explicit log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create deployment package
        code_archive = AssetArchive({
            "index.py": FileAsset("./lib/infrastructure/lambda_code/data_processor/index.py")
        })
        
        # Environment variables
        environment_vars = {
            **self.config.get_lambda_config()['environment'],
            'DYNAMODB_TABLE_NAME': self.dynamodb_stack.get_main_table_name(),
            'S3_BUCKET_NAME': self.s3_stack.get_static_assets_bucket_name(),
            'LOG_LEVEL': 'INFO'
        }
        
        # Create the Lambda function
        function = aws.lambda_.Function(
            function_name,
            code=code_archive,
            handler="index.handler",
            runtime=self.config.lambda_runtime,
            role=self.iam_stack.lambda_execution_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=environment_vars
            ),
            # Enable X-Ray tracing
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.tags,
            opts=ResourceOptions(
                parent=self.opts.parent, 
                provider=self.opts.provider,
                depends_on=[log_group]
            )
        )
        
        return function
    
    def _create_error_handler(self):
        """Create the error handler Lambda function."""
        function_name = f"{self.config.get_resource_name('lambda-function', 'error-handler')}-{self.config.environment}"
        
        # Create explicit log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create deployment package
        code_archive = AssetArchive({
            "index.py": FileAsset("./lib/infrastructure/lambda_code/error_handler/index.py")
        })
        
        # Environment variables
        environment_vars = {
            **self.config.get_lambda_config()['environment'],
            'DYNAMODB_AUDIT_TABLE_NAME': self.dynamodb_stack.get_audit_table_name(),
            'LOG_LEVEL': 'ERROR'
        }
        
        # Create the Lambda function
        function = aws.lambda_.Function(
            function_name,
            code=code_archive,
            handler="index.handler",
            runtime=self.config.lambda_runtime,
            role=self.iam_stack.lambda_execution_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=environment_vars
            ),
            # Enable X-Ray tracing
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.tags,
            opts=ResourceOptions(
                parent=self.opts.parent, 
                provider=self.opts.provider,
                depends_on=[log_group]
            )
        )
        
        return function
    
    def get_api_handler_arn(self) -> pulumi.Output[str]:
        """Get API handler function ARN."""
        return self.api_handler.arn
    
    def get_api_handler_invoke_arn(self) -> pulumi.Output[str]:
        """Get API handler function invoke ARN."""
        return self.api_handler.invoke_arn
    
    def get_data_processor_arn(self) -> pulumi.Output[str]:
        """Get data processor function ARN."""
        return self.data_processor.arn
    
    def get_error_handler_arn(self) -> pulumi.Output[str]:
        """Get error handler function ARN."""
        return self.error_handler.arn
