"""
SNS Topic configuration for alerting and notifications.

This module creates SNS topics and subscriptions for
failure and recovery notifications.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class SNSStack:
    """
    Manages SNS topics for notifications.
    
    Note: Email subscriptions require manual confirmation.
    """
    
    def __init__(self, config: Config, email_endpoint: Optional[str] = None):
        """
        Initialize SNS stack.
        
        Args:
            config: Configuration object
            email_endpoint: Optional email address for alerts
        """
        self.config = config
        self.email_endpoint = email_endpoint or 'devops@example.com'
        
        self.alert_topic = self._create_alert_topic()
        
        if self.email_endpoint:
            self._create_email_subscription()
    
    def _create_alert_topic(self) -> aws.sns.Topic:
        """Create SNS topic for alerts."""
        topic_name = self.config.get_resource_name('alerts')
        
        topic = aws.sns.Topic(
            'alert-topic',
            name=topic_name,
            display_name=f"{self.config.app_name} Infrastructure Alerts",
            tags=self.config.get_tags({
                'Purpose': 'Alerting'
            })
        )
        
        # Add topic policy for Lambda and CloudWatch to publish
        topic_policy = Output.all(topic.arn, aws.get_caller_identity().account_id, self.config.primary_region).apply(
            lambda args: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowLambdaPublish",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "SNS:Publish",
                        "Resource": args[0],
                        "Condition": {
                            "StringEquals": {
                                "aws:SourceAccount": args[1]
                            }
                        }
                    },
                    {
                        "Sid": "AllowCloudWatchPublish",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudwatch.amazonaws.com"
                        },
                        "Action": "SNS:Publish",
                        "Resource": args[0],
                        "Condition": {
                            "StringEquals": {
                                "aws:SourceAccount": args[1]
                            }
                        }
                    }
                ]
            }
        )
        
        aws.sns.TopicPolicy(
            'alert-topic-policy',
            arn=topic.arn,
            policy=topic_policy.apply(lambda p: pulumi.Output.json_dumps(p))
        )
        
        return topic
    
    def _create_email_subscription(self) -> aws.sns.TopicSubscription:
        """
        Create email subscription to alert topic.
        
        Note: This requires manual confirmation via email.
        The subscription will remain in "PendingConfirmation" state
        until the user clicks the confirmation link in the email.
        """
        subscription = aws.sns.TopicSubscription(
            'alert-email-subscription',
            topic=self.alert_topic.arn,
            protocol='email',
            endpoint=self.email_endpoint
        )
        
        # Export message about required confirmation
        pulumi.export('sns_subscription_note', 
            f"Email subscription to {self.email_endpoint} requires confirmation. "
            "Check your email and click the confirmation link."
        )
        
        return subscription
    
    def get_topic_arn(self) -> Output[str]:
        """
        Get alert topic ARN.
        
        Returns:
            Topic ARN as Output[str]
        """
        return self.alert_topic.arn
    
    def get_topic_name(self) -> Output[str]:
        """
        Get alert topic name.
        
        Returns:
            Topic name as Output[str]
        """
        return self.alert_topic.name

