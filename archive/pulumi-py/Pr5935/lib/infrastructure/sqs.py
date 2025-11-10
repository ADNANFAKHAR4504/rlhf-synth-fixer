"""
SQS module for dead letter queues.

This module creates SQS queues with KMS encryption for use as
dead letter queues for Lambda functions.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class SQSStack:
    """
    Manages SQS queues for dead letter queue functionality.
    
    Creates SQS queues with:
    - KMS encryption
    - Message retention
    - Visibility timeout
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues = {}
    
    def create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """
        Create a dead letter queue for a Lambda function.
        
        Args:
            function_name: Name of the Lambda function
            
        Returns:
            SQS Queue resource
        """
        dlq_name = f'{function_name}-dlq'
        resource_name = self.config.get_resource_name(dlq_name)
        
        sqs_key = self.kms_stack.get_key('sqs')
        
        queue = aws.sqs.Queue(
            dlq_name,
            name=resource_name,
            message_retention_seconds=1209600,
            visibility_timeout_seconds=300,
            kms_master_key_id=sqs_key.id,
            kms_data_key_reuse_period_seconds=300,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'DLQ for {function_name}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[sqs_key])
        )
        
        self.queues[dlq_name] = queue
        return queue
    
    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """
        Get an SQS queue by name.
        
        Args:
            queue_name: Name of the queue
            
        Returns:
            SQS Queue resource
        """
        return self.queues.get(queue_name)
    
    def get_queue_url(self, queue_name: str) -> Output[str]:
        """
        Get the URL of an SQS queue.
        
        Args:
            queue_name: Name of the queue
            
        Returns:
            Queue URL as Output
        """
        queue = self.get_queue(queue_name)
        return queue.url if queue else None
    
    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """
        Get the ARN of an SQS queue.
        
        Args:
            queue_name: Name of the queue
            
        Returns:
            Queue ARN as Output
        """
        queue = self.get_queue(queue_name)
        return queue.arn if queue else None

