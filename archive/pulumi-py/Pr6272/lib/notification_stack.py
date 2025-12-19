"""
notification_stack.py

SNS notification infrastructure module.
Creates SNS topics and subscriptions for migration alerts.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class NotificationStackArgs:
    """Arguments for NotificationStack component."""

    def __init__(
        self,
        environment_suffix: str,
        alert_email_addresses: Optional[List[str]] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.alert_email_addresses = alert_email_addresses or []
        self.tags = tags or {}


class NotificationStack(pulumi.ComponentResource):
    """
    SNS notification infrastructure for migration project.

    Creates:
    - SNS topic for migration status notifications
    - SNS topic for error alerts
    - SNS topic for validation alerts
    - Email subscriptions for operations team
    """

    def __init__(
        self,
        name: str,
        args: NotificationStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:notification:NotificationStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Notification'
        }

        # Migration Status Topic
        self.migration_status_topic = aws.sns.Topic(
            f"migration-status-topic-{self.environment_suffix}",
            name=f"migration-status-{self.environment_suffix}",
            display_name=f"Migration Status Notifications - {self.environment_suffix}",
            delivery_policy=json.dumps({
                "http": {
                    "defaultHealthyRetryPolicy": {
                        "minDelayTarget": 20,
                        "maxDelayTarget": 20,
                        "numRetries": 3,
                        "numMaxDelayRetries": 0,
                        "numNoDelayRetries": 0,
                        "numMinDelayRetries": 0,
                        "backoffFunction": "linear"
                    }
                }
            }),
            tags={
                **self.tags,
                'Name': f"migration-status-topic-{self.environment_suffix}",
                'TopicType': 'Status'
            },
            opts=ResourceOptions(parent=self)
        )

        # Error Alerts Topic
        self.error_alerts_topic = aws.sns.Topic(
            f"migration-error-topic-{self.environment_suffix}",
            name=f"migration-errors-{self.environment_suffix}",
            display_name=f"Migration Error Alerts - {self.environment_suffix}",
            tags={
                **self.tags,
                'Name': f"migration-error-topic-{self.environment_suffix}",
                'TopicType': 'Errors'
            },
            opts=ResourceOptions(parent=self)
        )

        # Validation Alerts Topic
        self.validation_alerts_topic = aws.sns.Topic(
            f"validation-alerts-topic-{self.environment_suffix}",
            name=f"validation-alerts-{self.environment_suffix}",
            display_name=f"Data Validation Alerts - {self.environment_suffix}",
            tags={
                **self.tags,
                'Name': f"validation-alerts-topic-{self.environment_suffix}",
                'TopicType': 'Validation'
            },
            opts=ResourceOptions(parent=self)
        )

        # DMS Alerts Topic
        self.dms_alerts_topic = aws.sns.Topic(
            f"dms-alerts-topic-{self.environment_suffix}",
            name=f"dms-alerts-{self.environment_suffix}",
            display_name=f"DMS Replication Alerts - {self.environment_suffix}",
            tags={
                **self.tags,
                'Name': f"dms-alerts-topic-{self.environment_suffix}",
                'TopicType': 'DMS'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create email subscriptions if email addresses provided
        if args.alert_email_addresses:
            for i, email in enumerate(args.alert_email_addresses):
                # Subscribe to migration status
                aws.sns.TopicSubscription(
                    f"migration-status-email-sub-{i+1}-{self.environment_suffix}",
                    topic=self.migration_status_topic.arn,
                    protocol="email",
                    endpoint=email,
                    opts=ResourceOptions(parent=self.migration_status_topic)
                )

                # Subscribe to error alerts
                aws.sns.TopicSubscription(
                    f"error-alerts-email-sub-{i+1}-{self.environment_suffix}",
                    topic=self.error_alerts_topic.arn,
                    protocol="email",
                    endpoint=email,
                    opts=ResourceOptions(parent=self.error_alerts_topic)
                )

                # Subscribe to validation alerts
                aws.sns.TopicSubscription(
                    f"validation-alerts-email-sub-{i+1}-{self.environment_suffix}",
                    topic=self.validation_alerts_topic.arn,
                    protocol="email",
                    endpoint=email,
                    opts=ResourceOptions(parent=self.validation_alerts_topic)
                )

                # Subscribe to DMS alerts
                aws.sns.TopicSubscription(
                    f"dms-alerts-email-sub-{i+1}-{self.environment_suffix}",
                    topic=self.dms_alerts_topic.arn,
                    protocol="email",
                    endpoint=email,
                    opts=ResourceOptions(parent=self.dms_alerts_topic)
                )

        # SNS Topic Policy for CloudWatch Alarms
        self._create_topic_policy(self.migration_status_topic, "migration-status")
        self._create_topic_policy(self.error_alerts_topic, "error-alerts")
        self._create_topic_policy(self.validation_alerts_topic, "validation-alerts")
        self._create_topic_policy(self.dms_alerts_topic, "dms-alerts")

        # Register outputs
        self.register_outputs({
            'migration_status_topic_arn': self.migration_status_topic.arn,
            'error_alerts_topic_arn': self.error_alerts_topic.arn,
            'validation_alerts_topic_arn': self.validation_alerts_topic.arn,
            'dms_alerts_topic_arn': self.dms_alerts_topic.arn
        })

    def _create_topic_policy(self, topic: aws.sns.Topic, topic_name: str):
        """Create SNS topic policy to allow CloudWatch and other AWS services to publish."""

        policy = aws.sns.TopicPolicy(
            f"{topic_name}-policy-{self.environment_suffix}",
            arn=topic.arn,
            policy=Output.all(topic.arn).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "cloudwatch.amazonaws.com",
                                "lambda.amazonaws.com",
                                "events.amazonaws.com",
                                "dms.amazonaws.com"
                            ]
                        },
                        "Action": [
                            "SNS:Publish"
                        ],
                        "Resource": args[0]
                    }
                ]
            })),
            opts=ResourceOptions(parent=topic)
        )
