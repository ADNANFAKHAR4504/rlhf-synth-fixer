"""
SQS module for Dead Letter Queue management.

This module creates SQS queues for use as Dead Letter Queues (DLQs)
for Lambda functions with KMS encryption.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SQSStack:
    """
    Manages SQS queues for Dead Letter Queues.
    
    Creates SQS queues with KMS encryption for failed Lambda invocations.
    """
    
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
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}
        
        self._create_user_service_dlq()
        self._create_order_service_dlq()
        self._create_product_service_dlq()
    
    def _create_user_service_dlq(self):
        """Create DLQ for user service Lambda."""
        queue_name = self.config.get_resource_name('user-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        queue = aws.sqs.Queue(
            'user-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.queues['user-service'] = queue
    
    def _create_order_service_dlq(self):
        """Create DLQ for order service Lambda."""
        queue_name = self.config.get_resource_name('order-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        queue = aws.sqs.Queue(
            'order-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.queues['order-service'] = queue
    
    def _create_product_service_dlq(self):
        """Create DLQ for product service Lambda."""
        queue_name = self.config.get_resource_name('product-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        queue = aws.sqs.Queue(
            'product-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.queues['product-service'] = queue
    
    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """
        Get a queue by name.
        
        Args:
            queue_name: Name of the queue
            
        Returns:
            SQS Queue resource
        """
        return self.queues.get(queue_name)
    
    def get_queue_url(self, queue_name: str) -> pulumi.Output[str]:
        """
        Get the URL of a queue.
        
        Args:
            queue_name: Key of the queue
            
        Returns:
            Queue URL as Output
        """
        queue = self.get_queue(queue_name)
        return queue.url if queue else None
    
    def get_queue_arn(self, queue_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a queue.
        
        Args:
            queue_name: Key of the queue
            
        Returns:
            Queue ARN as Output
        """
        queue = self.get_queue(queue_name)
        return queue.arn if queue else None

