"""
SNS topic management for notifications.

This module creates SNS topics for sending notifications
from Lambda functions and CloudWatch alarms.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class NotificationsStack(pulumi.ComponentResource):
    """
    Manages SNS topics for the serverless application.
    
    Creates topics for:
    - Application notifications
    - CloudWatch alarm notifications
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize notifications stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:notifications:NotificationsStack",
            config.get_resource_name("notifications"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        
        # Create notifications topic
        self.notifications_topic = self._create_notifications_topic()
        
        self.register_outputs({
            "notifications_topic_arn": self.notifications_topic.arn,
        })
    
    def _create_notifications_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for application notifications.
        
        Returns:
            SNS Topic resource
        """
        return aws.sns.Topic(
            resource_name=self.config.get_resource_name("topic-notifications"),
            name=self.config.get_resource_name("topic-notifications"),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

