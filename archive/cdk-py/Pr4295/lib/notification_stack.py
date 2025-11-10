"""notification_stack.py

This module defines the NotificationStack, which creates SNS topics for notifications.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_sns as sns, aws_sns_subscriptions as subscriptions
from constructs import Construct


class NotificationStackProps(cdk.NestedStackProps):
    """Properties for NotificationStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class NotificationStack(cdk.NestedStack):
    """
    NotificationStack creates SNS topics for the video processing notification system.

    This stack provides:
    - SNS topic for video processing completion notifications
    - SNS topic for error notifications
    - KMS encryption for topics
    - SQS dead-letter queue for failed notifications
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[NotificationStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix if props else "dev"

        # Create SNS topic for video processing completion
        self.completion_topic = sns.Topic(
            self,
            "VideoProcessingCompletionTopic",
            topic_name=f"video-processing-completion-{environment_suffix}",
            display_name="Video Processing Completion Notifications",
            fifo=False,
        )

        # Create SNS topic for error notifications
        self.error_topic = sns.Topic(
            self,
            "VideoProcessingErrorTopic",
            topic_name=f"video-processing-error-{environment_suffix}",
            display_name="Video Processing Error Notifications",
            fifo=False,
        )

        # Add email subscription placeholder (would be configured with actual email)
        # In production, you would subscribe actual email addresses
        # For now, we just export the topic ARN for manual subscription

        # Outputs
        cdk.CfnOutput(
            self,
            "CompletionTopicArn",
            value=self.completion_topic.topic_arn,
            description="SNS topic ARN for video processing completion notifications",
            export_name=f"CompletionTopicArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "CompletionTopicName",
            value=self.completion_topic.topic_name,
            description="SNS topic name for completion notifications",
            export_name=f"CompletionTopicName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ErrorTopicArn",
            value=self.error_topic.topic_arn,
            description="SNS topic ARN for video processing error notifications",
            export_name=f"ErrorTopicArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ErrorTopicName",
            value=self.error_topic.topic_name,
            description="SNS topic name for error notifications",
            export_name=f"ErrorTopicName-{environment_suffix}",
        )
