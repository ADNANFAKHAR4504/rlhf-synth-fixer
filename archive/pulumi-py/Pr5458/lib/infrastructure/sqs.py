"""
SQS module for the serverless infrastructure.

This module creates SQS Dead Letter Queues (DLQs) for Lambda functions
as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class SQSStack:
    """
    Manages SQS queues for the serverless infrastructure.
    
    Model failure fix: Creates proper SQS DLQs per Lambda (not EventSourceMapping).
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize SQS Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.queues = {}
    
    def create_dlq(self, name: str) -> aws.sqs.Queue:
        """
        Create Dead Letter Queue for Lambda function.
        
        Args:
            name: Queue name identifier (e.g., 'processing-lambda')
            
        Returns:
            SQS Queue resource
        """
        queue_name = self.config.get_resource_name(f"{name}-dlq", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        queue = aws.sqs.Queue(
            f"{name}-dlq",
            name=queue_name,
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=self.config.lambda_timeout * 6,  # 6x Lambda timeout
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.queues[name] = queue
        return queue
    
    def get_queue_arn(self, name: str) -> Output[str]:
        """Get queue ARN by name."""
        return self.queues[name].arn
    
    def get_queue_url(self, name: str) -> Output[str]:
        """Get queue URL by name."""
        return self.queues[name].url

