"""
Notifications module for SNS topic management.

This module creates SNS topics for Lambda execution notifications
and alarm notifications.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class NotificationsStack:
    """
    Manages SNS topics for notifications.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource
    ):
        """
        Initialize notifications stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.parent = parent
        
        # Create SNS topic for notifications
        if self.config.enable_notifications:
            self.topic = self._create_topic()
        else:
            self.topic = None
    
    def _create_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for notifications.
        
        Returns:
            SNS Topic resource
        """
        topic_name = self.config.get_resource_name('notifications')
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                protect=True  # Prevent accidental deletion
            )
        )
        
        return topic
    
    def get_topic_arn(self) -> Output[str]:
        """
        Get topic ARN.
        
        Returns:
            Topic ARN as Output
        """
        if self.topic:
            return self.topic.arn
        return Output.from_input("")
    
    def get_topic(self) -> aws.sns.Topic:
        """
        Get topic resource.
        
        Returns:
            SNS Topic resource
        """
        return self.topic

