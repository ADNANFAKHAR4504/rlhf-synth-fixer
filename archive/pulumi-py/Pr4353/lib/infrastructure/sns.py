"""
SNS module for EC2 failure recovery infrastructure.
Manages alert notifications with email subscription handling.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class SNSStack:
    """SNS resources for EC2 recovery alerts."""
    
    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.topic = self._create_alert_topic()
        self.email_subscription = self._create_email_subscription()
    
    def _create_alert_topic(self) -> aws.sns.Topic:
        """Create SNS topic for EC2 recovery alerts."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.sns.Topic(
            f"{self.config.get_tag_name('alert-topic')}-{random_suffix}",
            name=self.config.sns_topic_name,
            tags={
                "Name": self.config.get_tag_name("alert-topic"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Alerts"
            }
        )
    
    def _create_email_subscription(self) -> aws.sns.TopicSubscription:
        """Create email subscription for alerts."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.sns.TopicSubscription(
            f"{self.config.get_tag_name('email-subscription')}-{random_suffix}",
            topic=self.topic.arn,
            protocol="email",
            endpoint=self.config.alert_email
        )
    
    def get_topic_arn(self) -> pulumi.Output[str]:
        """Get the SNS topic ARN."""
        return self.topic.arn
    
    def get_topic_name(self) -> pulumi.Output[str]:
        """Get the SNS topic name."""
        return self.topic.name
