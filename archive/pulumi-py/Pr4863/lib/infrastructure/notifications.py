"""
Notifications infrastructure module.

This module creates SNS topics and subscriptions for alarm notifications.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NotificationsStack:
    """
    Creates and manages SNS topics and subscriptions for notifications.
    """
    
    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the notifications stack.
        
        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent
        
        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()
        
        # Create email subscription if email is configured
        if self.config.alarm_email:
            self.email_subscription = self._create_email_subscription()
    
    def _create_alarm_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.
        
        Returns:
            SNS Topic resource
        """
        topic_name = self.config.get_resource_name('topic-alarms')
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            display_name='Infrastructure Alarms',
            tags=self.config.get_tags_for_resource('SNSTopic', Name=topic_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return topic
    
    def _create_email_subscription(self) -> aws.sns.TopicSubscription:
        """
        Create email subscription to alarm topic.
        
        Returns:
            Topic Subscription resource
        """
        subscription_name = self.config.get_resource_name('subscription-email')
        
        subscription = aws.sns.TopicSubscription(
            subscription_name,
            topic=self.alarm_topic.arn,
            protocol='email',
            endpoint=self.config.alarm_email,
            opts=ResourceOptions(parent=self.alarm_topic)
        )
        
        return subscription
    
    def get_alarm_topic_arn(self) -> Output[str]:
        """Get alarm topic ARN."""
        return self.alarm_topic.arn

