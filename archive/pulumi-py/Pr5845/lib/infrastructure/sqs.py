"""
SQS module for queue management.

This module creates and manages SQS queues for Lambda dead letter queues
with KMS encryption.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SQSStack:
    """Manages SQS queues for dead letter queues."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}
    
    def create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """
        Create a dead letter queue for a Lambda function.
        
        Args:
            function_name: Name of the Lambda function
            
        Returns:
            SQS Queue resource
        """
        resource_name = self.config.get_resource_name(f'dlq-{function_name}')
        
        queue = aws.sqs.Queue(
            f'sqs-dlq-{function_name}',
            name=resource_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            kms_data_key_reuse_period_seconds=300,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.queues[function_name] = queue
        return queue
    
    def get_queue_arn(self, function_name: str) -> Output[str]:
        """
        Get SQS queue ARN.
        
        Args:
            function_name: Name of the Lambda function
            
        Returns:
            Queue ARN as Output
        """
        return self.queues[function_name].arn
    
    def get_queue_url(self, function_name: str) -> Output[str]:
        """
        Get SQS queue URL.
        
        Args:
            function_name: Name of the Lambda function
            
        Returns:
            Queue URL as Output
        """
        return self.queues[function_name].url

