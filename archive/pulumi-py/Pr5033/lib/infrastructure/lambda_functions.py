"""
Lambda functions module.

This module creates Lambda functions with proper retry configuration,
timeout settings, and S3 event triggers using AWS-native retry mechanisms.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class LambdaStack:
    """
    Manages Lambda functions for file processing.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_role_arn: Output[str],
        bucket_name: Output[str],
        bucket_arn: Output[str],
        topic_arn: Output[str],
        parent: pulumi.Resource
    ):
        """
        Initialize Lambda stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            lambda_role_arn: Lambda execution role ARN
            bucket_name: S3 bucket name
            bucket_arn: S3 bucket ARN
            topic_arn: SNS topic ARN
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.lambda_role_arn = lambda_role_arn
        self.bucket_name = bucket_name
        self.bucket_arn = bucket_arn
        self.topic_arn = topic_arn
        self.parent = parent
        
        # Create Lambda function
        self.function = self._create_function()
        
        # Configure S3 trigger
        self._configure_s3_trigger()
    
    def _create_function(self) -> aws.lambda_.Function:
        """
        Create Lambda function with proper configuration.
        
        Returns:
            Lambda Function resource
        """
        function_name = self.config.get_resource_name('file-processor')
        
        function = aws.lambda_.Function(
            function_name,
            name=function_name,
            role=self.lambda_role_arn,
            runtime=self.config.lambda_runtime,
            handler="file_processor.lambda_handler",
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/infrastructure/lambda_code")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.topic_arn,
                    "BUCKET_NAME": self.bucket_name
                }
            ),
            # Use AWS EventSourceMapping for retry configuration
            # instead of manual retries in code
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                protect=True  # Prevent accidental deletion
            )
        )
        
        # Configure dead letter queue for failed executions
        if self.config.enable_notifications:
            aws.lambda_.FunctionEventInvokeConfig(
                f"{function_name}-event-config",
                function_name=function.name,
                maximum_retry_attempts=self.config.lambda_max_retries,
                destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                    on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                        destination=self.topic_arn
                    )
                ),
                opts=ResourceOptions(
                    provider=self.provider,
                    parent=self.parent
                )
            )
        
        return function
    
    def _configure_s3_trigger(self):
        """Configure S3 bucket notification to trigger Lambda."""
        function_name = self.config.get_resource_name('file-processor')
        bucket_name = self.config.get_s3_bucket_name('files')
        
        # Grant S3 permission to invoke Lambda
        s3_permission = aws.lambda_.Permission(
            f"{function_name}-s3-permission",
            action="lambda:InvokeFunction",
            function=self.function.name,
            principal="s3.amazonaws.com",
            source_arn=self.bucket_arn,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        # Create bucket notification - depends on permission being created
        aws.s3.BucketNotification(
            f"{bucket_name}-notification",
            bucket=self.bucket_name,
            lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=self.function.arn,
                events=["s3:ObjectCreated:*"]
            )],
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                depends_on=[self.function, s3_permission]
            )
        )
    
    def get_function_arn(self) -> Output[str]:
        """
        Get Lambda function ARN.
        
        Returns:
            Function ARN as Output
        """
        return self.function.arn
    
    def get_function_name(self) -> Output[str]:
        """
        Get Lambda function name.
        
        Returns:
            Function name as Output
        """
        return self.function.name
    
    def get_function(self) -> aws.lambda_.Function:
        """
        Get Lambda function resource.
        
        Returns:
            Lambda Function resource
        """
        return self.function

