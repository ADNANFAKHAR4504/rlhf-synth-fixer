"""
Lambda functions management for serverless application.

This module creates and configures Lambda functions with:
- API Handler: Processes API Gateway requests
- File Processor: Processes S3 file uploads
- Stream Processor: Processes DynamoDB stream events
"""

import os

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class LambdaStack(pulumi.ComponentResource):
    """
    Manages Lambda functions for the serverless application.
    
    Creates three Lambda functions with proper configuration:
    - Event invoke config for retries and DLQ
    - Environment variables
    - Permissions for triggers
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        iam_stack: 'IAMStack',
        dynamodb_stack: 'DynamoDBStack',
        storage_stack: 'StorageStack',
        notifications_stack: 'NotificationsStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize Lambda stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            iam_stack: IAM stack with roles
            dynamodb_stack: DynamoDB stack with tables
            storage_stack: Storage stack with buckets
            notifications_stack: Notifications stack with topics
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:lambda:LambdaStack",
            config.get_resource_name("lambda"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.storage_stack = storage_stack
        self.notifications_stack = notifications_stack
        
        # Create Lambda functions
        self.api_handler = self._create_api_handler()
        self.file_processor = self._create_file_processor()
        self.stream_processor = self._create_stream_processor()
        
        # Configure event invoke configs
        self._configure_event_invoke_config(self.api_handler, "api-handler")
        self._configure_event_invoke_config(self.file_processor, "file-processor")
        self._configure_event_invoke_config(self.stream_processor, "stream-processor")
        
        # Configure S3 trigger for file processor
        self._configure_s3_trigger()
        
        # Configure DynamoDB stream trigger for stream processor
        self._configure_stream_trigger()
        
        self.register_outputs({
            "api_handler_name": self.api_handler.name,
            "api_handler_arn": self.api_handler.arn,
            "file_processor_name": self.file_processor.name,
            "file_processor_arn": self.file_processor.arn,
            "stream_processor_name": self.stream_processor.name,
            "stream_processor_arn": self.stream_processor.arn,
        })
    
    def _create_api_handler(self) -> aws.lambda_.Function:
        """
        Create API handler Lambda function.
        
        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("api-handler"),
            name=self.config.get_lambda_function_name("api-handler"),
            runtime=self.config.lambda_runtime,
            handler="api_handler.handler",
            role=self.iam_stack.api_handler_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_stack.items_table.name,
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.api_handler_role,
                    self.dynamodb_stack.items_table,
                    self.notifications_stack.notifications_topic
                ]
            )
        )
    
    def _create_file_processor(self) -> aws.lambda_.Function:
        """
        Create file processor Lambda function.
        
        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("file-processor"),
            name=self.config.get_lambda_function_name("file-processor"),
            runtime=self.config.lambda_runtime,
            handler="file_processor.handler",
            role=self.iam_stack.file_processor_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_stack.items_table.name,
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.file_processor_role,
                    self.dynamodb_stack.items_table,
                    self.notifications_stack.notifications_topic
                ]
            )
        )
    
    def _create_stream_processor(self) -> aws.lambda_.Function:
        """
        Create stream processor Lambda function.
        
        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("stream-processor"),
            name=self.config.get_lambda_function_name("stream-processor"),
            runtime=self.config.lambda_runtime,
            handler="stream_processor.handler",
            role=self.iam_stack.stream_processor_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.stream_processor_role,
                    self.notifications_stack.notifications_topic
                ]
            )
        )
    
    def _configure_event_invoke_config(
        self,
        function: aws.lambda_.Function,
        function_type: str
    ) -> None:
        """
        Configure event invoke config for Lambda function.
        
        This enables AWS-native retry mechanism and DLQ.
        
        Args:
            function: Lambda function to configure
            function_type: Type of function for naming
        """
        aws.lambda_.FunctionEventInvokeConfig(
            resource_name=self.config.get_resource_name(f"lambda-event-config-{function_type}"),
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            maximum_event_age_in_seconds=180,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.notifications_stack.notifications_topic.arn
                )
            ),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[function, self.notifications_stack.notifications_topic]
            )
        )
    
    def _configure_s3_trigger(self) -> None:
        """Configure S3 bucket to trigger file processor Lambda."""
        # Grant S3 permission to invoke Lambda
        s3_permission = aws.lambda_.Permission(
            resource_name=self.config.get_resource_name("lambda-s3-permission"),
            action="lambda:InvokeFunction",
            function=self.file_processor.name,
            principal="s3.amazonaws.com",
            source_arn=self.storage_stack.files_bucket.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        # Configure S3 bucket notification
        aws.s3.BucketNotification(
            resource_name=self.config.get_resource_name("s3-notification"),
            bucket=self.storage_stack.files_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=self.file_processor.arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.file_processor, s3_permission]
            )
        )
    
    def _configure_stream_trigger(self) -> None:
        """Configure DynamoDB stream to trigger stream processor Lambda."""
        # Create event source mapping
        aws.lambda_.EventSourceMapping(
            resource_name=self.config.get_resource_name("lambda-stream-mapping"),
            event_source_arn=self.dynamodb_stack.items_table.stream_arn,
            function_name=self.stream_processor.name,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.stream_processor, self.dynamodb_stack.items_table]
            )
        )

