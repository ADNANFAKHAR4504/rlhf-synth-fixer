"""
Lambda functions module.

This module creates Lambda functions with environment-specific configurations
and proper packaging for multi-account deployments.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack
from .storage import StorageStack


class LambdaStack:
    """
    Manages Lambda functions for the multi-environment infrastructure.
    
    Creates Lambda functions with:
    - Environment-specific memory sizes
    - Proper IAM roles with least privilege
    - Environment variables for DynamoDB and environment
    """
    
    def __init__(
        self,
        config: MultiEnvConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        
        self._create_process_function()
    
    def _create_process_function(self) -> None:
        """Create the data processing Lambda function."""
        function_name = self.config.get_resource_name('process-data')
        
        s3_bucket_arns = [self.storage_stack.get_bucket_arn('data')]
        dynamodb_table_arns = [self.dynamodb_stack.get_table_arn('items')]
        sqs_queue_arns = [self.sqs_stack.get_dlq_arn('eventbridge')]
        
        role = self.iam_stack.create_lambda_role(
            'process-data',
            s3_bucket_arns,
            dynamodb_table_arns,
            sqs_queue_arns
        )
        
        handler_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )
        
        opts = ResourceOptions(
            provider=self.provider,
            depends_on=[role]
        ) if self.provider else ResourceOptions(depends_on=[role])
        
        self.functions['process-data'] = aws.lambda_.Function(
            f"{function_name}-function",
            name=function_name,
            runtime=self.config.lambda_runtime,
            role=role.arn,
            handler='process_handler.lambda_handler',
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive(handler_path)
            }),
            memory_size=self.config.lambda_memory_size,
            timeout=self.config.lambda_timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE': self.dynamodb_stack.get_table_name('items'),
                    'ENVIRONMENT': self.config.environment
                }
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
    
    def get_function(self, name: str = 'process-data') -> aws.lambda_.Function:
        """
        Get Lambda function by name.
        
        Args:
            name: Function name (default: 'process-data')
        
        Returns:
            Lambda Function resource
        """
        return self.functions.get(name)
    
    def get_function_name(self, name: str = 'process-data') -> Output[str]:
        """
        Get Lambda function name by name.
        
        Args:
            name: Function name (default: 'process-data')
        
        Returns:
            Function name as Output[str]
        """
        function = self.get_function(name)
        return function.name if function else None
    
    def get_function_arn(self, name: str = 'process-data') -> Output[str]:
        """
        Get Lambda function ARN by name.
        
        Args:
            name: Function name (default: 'process-data')
        
        Returns:
            Function ARN as Output[str]
        """
        function = self.get_function(name)
        return function.arn if function else None

