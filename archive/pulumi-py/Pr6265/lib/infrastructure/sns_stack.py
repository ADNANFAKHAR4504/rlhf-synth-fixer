"""
SNS topics for alerting in both regions.
BUG #23: Missing cross-region subscription configuration
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional


class SnsStack(pulumi.ComponentResource):
    """SNS topics for alerting and notifications."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:SnsStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-sns-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-sns-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Primary SNS topic
        self.primary_topic = aws.sns.Topic(
            f"trading-alerts-primary-{environment_suffix}",
            name=f"trading-alerts-primary-{environment_suffix}-new",
            display_name="Trading Platform Alerts - Primary",
            tags={**tags, 'Name': f"trading-alerts-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary SNS topic
        self.secondary_topic = aws.sns.Topic(
            f"trading-alerts-secondary-{environment_suffix}",
            name=f"trading-alerts-secondary-{environment_suffix}-new",
            display_name="Trading Platform Alerts - Secondary",
            tags={**tags, 'Name': f"trading-alerts-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # BUG #23: Missing cross-region subscription configuration
        # Should subscribe secondary topic to primary topic for cross-region notifications
        # Missing:
        # aws.sns.TopicSubscription(
        #     f"cross-region-subscription-{environment_suffix}",
        #     protocol="sns",
        #     endpoint=self.secondary_topic.arn,
        #     topic=self.primary_topic.arn,
        #     ...
        # )

        self.primary_topic_arn = self.primary_topic.arn
        self.secondary_topic_arn = self.secondary_topic.arn

        self.register_outputs({
            'primary_topic_arn': self.primary_topic.arn,
            'secondary_topic_arn': self.secondary_topic.arn,
        })
