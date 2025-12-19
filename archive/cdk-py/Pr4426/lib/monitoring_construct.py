"""monitoring_construct.py
CloudWatch alarms, SNS topics, and monitoring configuration.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_kms as kms,
    aws_logs as logs
)


class MonitoringConstruct(Construct):
    """
    Creates monitoring and alerting infrastructure using CloudWatch and SNS.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kms_key: kms.Key,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS topic for alarms
        self.alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{environment_suffix}",
            topic_name=f"healthcare-alarms-{environment_suffix}",
            display_name="Healthcare Platform Alarms",
            master_key=kms_key
        )

        # Note: In production, add email subscriptions
        # self.alarm_topic.add_subscription(
        #     sns_subscriptions.EmailSubscription("ops-team@example.com")
        # )

        # Create application log group
        self.app_log_group = logs.LogGroup(
            self,
            f"AppLogGroup-{environment_suffix}",
            log_group_name=f"/app/healthcare-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            encryption_key=kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )
