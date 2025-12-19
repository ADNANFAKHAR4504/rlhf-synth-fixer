"""
SQS module for Dead Letter Queues.

This module creates SQS queues for EventBridge DLQs with environment-specific
retention periods.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class SQSStack:
    """
    Manages SQS Dead Letter Queues for EventBridge rules.
    
    Creates DLQs with environment-specific retention periods:
    - dev: 7 days
    - staging: 14 days
    - prod: 30 days
    """
    
    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SQS stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.dlqs: Dict[str, aws.sqs.Queue] = {}
        
        self._create_dlq()
    
    def _create_dlq(self) -> None:
        """Create the DLQ for EventBridge rules."""
        dlq_name = self.config.get_resource_name('eventbridge-dlq')
        
        retention_seconds = self.config.dlq_retention_days * 86400
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        self.dlqs['eventbridge'] = aws.sqs.Queue(
            f"{dlq_name}-queue",
            name=dlq_name,
            message_retention_seconds=retention_seconds,
            tags=self.config.get_common_tags(),
            opts=opts
        )
    
    def get_dlq(self, name: str = 'eventbridge') -> aws.sqs.Queue:
        """
        Get DLQ by name.
        
        Args:
            name: Name of the DLQ (default: 'eventbridge')
        
        Returns:
            SQS Queue resource
        """
        return self.dlqs.get(name)
    
    def get_dlq_arn(self, name: str = 'eventbridge') -> Output[str]:
        """
        Get DLQ ARN by name.
        
        Args:
            name: Name of the DLQ (default: 'eventbridge')
        
        Returns:
            DLQ ARN as Output[str]
        """
        dlq = self.get_dlq(name)
        return dlq.arn if dlq else None
    
    def get_dlq_url(self, name: str = 'eventbridge') -> Output[str]:
        """
        Get DLQ URL by name.
        
        Args:
            name: Name of the DLQ (default: 'eventbridge')
        
        Returns:
            DLQ URL as Output[str]
        """
        dlq = self.get_dlq(name)
        return dlq.url if dlq else None

