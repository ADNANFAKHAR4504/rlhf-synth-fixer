# lib/components/monitoring.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi_aws.guardduty import get_detector
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Security Monitoring Infrastructure Component

This component creates and manages:
- CloudWatch for comprehensive monitoring and logging
- AWS GuardDuty for threat detection
- SNS topics for security alerting
"""

class SecurityMonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    region: str,
    # kms_key: aws.kms.Key,
    # kms_key_arn: pulumi.Input[str],
    tags: Optional[dict] = None,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('projectx:monitoring:SecurityMonitoring', name, None, opts)

    self.region = region
    # self.kms_key = kms_key
    # self.kms_key_arn = kms_key_arn
    self.tags = tags or {}

    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")
    # if not kms_key_arn:
    #   raise ValueError("kms_key_arn must be provided")

    self._create_cloudwatch_resources()
    self._create_sns_resources()
    # self._create_guardduty()

    self.register_outputs({
      "sns_topic_arn": self.sns_topic.arn,
      # "guardduty_detector_id": self.guardduty_detector.id,
      "security_log_group_name": self.security_log_group.name
    })

  def _create_cloudwatch_resources(self):
    self.security_log_group = aws.cloudwatch.LogGroup(
      f"{self.region.replace('-', '')}-security-logs",
      name=f"/aws/projectx/security/{self.region}",
      retention_in_days=365,
      # kms_key_id=self.kms_key.arn.apply(lambda arn: arn),
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
      # kms_master_key_id=self.kms_key.arn.apply(lambda arn: arn),
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

  # def _create_guardduty(self):
  #   try:
  #     # Try to get an existing detector for this account in the current region
  #     existing = get_detector()
  #     self.guardduty_detector = aws.guardduty.Detector.get(
  #       f"{self.region.replace('-', '')}-guardduty-existing",
  #       id=existing.id,
  #       opts=ResourceOptions(parent=self)
  #     )
  #   except Exception:
  #     # If none exists, create a new one
  #     self.guardduty_detector = aws.guardduty.Detector(
  #       f"{self.region.replace('-', '')}-guardduty",
  #       enable=True,
  #       finding_publishing_frequency="FIFTEEN_MINUTES",
  #       datasources=aws.guardduty.DetectorDatasourcesArgs(
  #         s3_logs=aws.guardduty.DetectorDatasourcesS3LogsArgs(enable=True)
  #       ),
  #       tags=self.tags,
  #       opts=ResourceOptions(parent=self, depends_on=[self.sns_topic])
  #     )
