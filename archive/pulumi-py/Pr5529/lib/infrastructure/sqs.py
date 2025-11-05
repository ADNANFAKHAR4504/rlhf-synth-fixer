"""
SQS module for the serverless payment processing system.

This module creates SQS Dead Letter Queues for Lambda functions.

"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import PaymentProcessingConfig


class SQSStack:
    """
    Manages SQS queues including Dead Letter Queues.
    
    Creates DLQs that will be properly attached to Lambda functions
    via dead_letter_config.
    """
    
    def __init__(self, config: PaymentProcessingConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SQS stack.
        
        Args:
            config: PaymentProcessingConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.queues: Dict[str, aws.sqs.Queue] = {}
        
        self._create_payment_processor_dlq()
    
    def _create_payment_processor_dlq(self):
        """Create Dead Letter Queue for payment processor Lambda."""
        queue_name = 'payment-processor-dlq'
        resource_name = self.config.get_resource_name(queue_name)
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        dlq = aws.sqs.Queue(
            queue_name,
            name=resource_name,
            message_retention_seconds=self.config.dlq_message_retention_seconds,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.queues[queue_name] = dlq
    
    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """Get a queue by name."""
        return self.queues.get(queue_name)
    
    def get_queue_url(self, queue_name: str) -> Output[str]:
        """Get a queue URL by name."""
        queue = self.queues.get(queue_name)
        if queue:
            return queue.url
        return Output.from_input("")
    
    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """Get a queue ARN by name."""
        queue = self.queues.get(queue_name)
        if queue:
            return queue.arn
        return Output.from_input("")


