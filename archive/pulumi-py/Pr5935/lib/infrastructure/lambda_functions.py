"""
Lambda Functions module.

This module creates Lambda functions with proper configuration including:
- DLQ attachment
- X-Ray tracing
- CloudWatch Logs
- Environment variables
- Least-privilege IAM roles
"""

import os

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions with proper configuration.
    
    Creates Lambda functions with:
    - Dead letter queues
    - X-Ray tracing
    - CloudWatch log groups
    - Environment variables
    - Least-privilege IAM roles
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        s3_stack: S3Stack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        sns_topic_arn: Output[str] = None
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            s3_stack: S3Stack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            sns_topic_arn: SNS topic ARN for notifications
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.sns_topic_arn = sns_topic_arn
        self.functions = {}
        self.log_groups = {}
        
        self._create_file_processor()
    
    def _create_file_processor(self):
        """Create the file processor Lambda function."""
        function_name = 'file-processor'
        resource_name = self.config.get_resource_name(function_name)
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-logs',
            name=f'/aws/lambda/{resource_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/lambda/{resource_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[function_name] = log_group
        
        dlq = self.sqs_stack.create_dlq(function_name)
        
        bucket_arn = self.s3_stack.get_bucket_arn('uploads')
        table_arn = self.dynamodb_stack.get_table_arn('file-metadata')
        s3_key_arn = self.kms_stack.get_key_arn('s3')
        dynamodb_key_arn = self.kms_stack.get_key_arn('dynamodb')
        sqs_key_arn = self.kms_stack.get_key_arn('sqs')
        sns_key_arn = self.kms_stack.get_key_arn('sns')
        
        kms_arns = [s3_key_arn, dynamodb_key_arn, sqs_key_arn, sns_key_arn]
        
        sns_arns = [self.sns_topic_arn] if self.sns_topic_arn else None
        
        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            s3_bucket_arns=[bucket_arn],
            dynamodb_table_arns=[table_arn],
            kms_key_arns=kms_arns,
            sns_topic_arns=sns_arns,
            dlq_arn=dlq.arn,
            enable_xray=self.config.enable_xray_tracing
        )
        
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        bucket_name = self.s3_stack.get_bucket_name('uploads')
        table_name = self.dynamodb_stack.get_table_name('file-metadata')
        
        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='file_processor.handler',
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': bucket_name,
                    'METADATA_TABLE': table_name,
                    'SNS_TOPIC_ARN': self.sns_topic_arn if self.sns_topic_arn else '',
                    'ENVIRONMENT': self.config.environment
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File processing'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[role, log_group, dlq]
            )
        )
        
        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-invoke-config',
            function_name=function.name,
            maximum_retry_attempts=2,
            maximum_event_age_in_seconds=3600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[function, dlq])
        )
        
        self.functions[function_name] = function
    
    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get a Lambda function by name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Lambda Function resource
        """
        return self.functions.get(function_name)
    
    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get the name of a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function name as Output
        """
        function = self.get_function(function_name)
        return function.name if function else None
    
    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get the ARN of a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function ARN as Output
        """
        function = self.get_function(function_name)
        return function.arn if function else None
    
    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """
        Get the invoke ARN of a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Function invoke ARN as Output
        """
        function = self.get_function(function_name)
        return function.invoke_arn if function else None
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get the log group name for a Lambda function.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Log group name as Output
        """
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else None

