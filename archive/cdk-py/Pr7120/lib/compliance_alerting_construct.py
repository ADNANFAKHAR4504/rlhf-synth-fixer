"""compliance_alerting_construct.py
SNS topics for compliance alerts.
"""

import aws_cdk as cdk
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sns_subscriptions as subscriptions
from constructs import Construct


class ComplianceAlertingConstruct(Construct):
    """
    Alerting infrastructure for compliance violations.

    Creates SNS topics for critical alerts with email subscriptions.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # SNS topic for critical compliance alerts
        self.critical_alert_topic = sns.Topic(
            self,
            "CriticalAlertTopic",
            topic_name=f"compliance-critical-alerts-{environment_suffix}",
            display_name="Critical Compliance Alerts",
            fifo=False
        )

        # SNS topic for warning-level alerts
        self.warning_alert_topic = sns.Topic(
            self,
            "WarningAlertTopic",
            topic_name=f"compliance-warning-alerts-{environment_suffix}",
            display_name="Compliance Warning Alerts",
            fifo=False
        )

        # Note: Email subscriptions should be added manually or via AWS Console
        # Uncomment and modify if you want to add subscriptions programmatically:
        # self.critical_alert_topic.add_subscription(
        #     subscriptions.EmailSubscription("security-team@example.com")
        # )
