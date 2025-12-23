# lib/components/monitoring.py

import json
from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from pulumi_aws import get_caller_identity

class SecurityMonitoringInfrastructure(pulumi.ComponentResource):
    def __init__(
        self,
        name: str,
        region: str,
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('projectx:monitoring:SecurityMonitoring', name, None, opts)

        self.region = region
        self.tags = tags or {}

        if not isinstance(self.tags, dict):
            raise ValueError("tags must be a dictionary")
        if not region:
            raise ValueError("region must be provided")

        self._create_cloudwatch_resources()
        self._create_sns_resources()

        self.register_outputs({
            "sns_topic_arn": self.sns_topic.arn,
            "security_log_group_name": self.security_log_group.name
        })

    def _create_cloudwatch_resources(self):
        self.security_log_group = aws.cloudwatch.LogGroup(
            f"{self.region.replace('-', '')}-security-logs",
            name=f"/aws/projectx/security/{self.region}",
            retention_in_days=365,
            tags=self.tags,
            opts=ResourceOptions(
                parent=self,
                custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
            )
        )

    def _create_sns_resources(self):
        self.sns_topic = aws.sns.Topic(
            f"{self.region.replace('-', '')}-security-alerts",
            name=f"projectx-security-alerts-{self.region}",
            display_name="ProjectX Security Alerts",
            tags=self.tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.security_log_group],
                custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
            )
        )

        sns_policy = pulumi.Output.all(
            topic_arn=self.sns_topic.arn,
            account_id=get_caller_identity().account_id
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowCloudWatchAlarmsToPublish",
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudwatch.amazonaws.com"},
                    "Action": "sns:Publish",
                    "Resource": args["topic_arn"],
                    "Condition": {"StringEquals": {"aws:SourceAccount": args["account_id"]}}
                }
            ]
        }))

        self.sns_topic_policy = aws.sns.TopicPolicy(
            f"{self.region.replace('-', '')}-sns-policy",
            arn=self.sns_topic.arn,
            policy=sns_policy,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.sns_topic],
                custom_timeouts={"create": "3m", "update": "3m", "delete": "3m"}
            )
        )