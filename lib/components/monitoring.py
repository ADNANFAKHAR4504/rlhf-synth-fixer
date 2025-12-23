# lib/components/monitoring.py

import pulumi
import pulumi_aws as aws
import json
from typing import List, Optional

"""
Monitoring Infrastructure Component
Creates Amazon SNS Topic and configures CloudWatch Alarms for various services.
"""

class MonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, tags: dict, opts=None):
    super().__init__("custom:monitoring:Infrastructure", name, None, opts)

    self.sns_topic = aws.sns.Topic(
      f"{name}-alerts-topic",
      name=f"{name}-alerts",
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.sns_topic_subscription = aws.sns.TopicSubscription(
      f"{name}-email-subscription",
      topic=self.sns_topic.arn,
      protocol="email",
      endpoint="your-alert-email@example.com",
      opts=pulumi.ResourceOptions(parent=self, depends_on=[self.sns_topic])
    )

    self.register_outputs({
      "sns_topic_arn": self.sns_topic.arn,
      "sns_topic_name": self.sns_topic.name
    })

  def setup_alarms(self,
                   lambda_function_names: List[pulumi.Output],
                   kinesis_stream_name: pulumi.Output,
                   cloudfront_distribution_id: pulumi.Output,
                   opts: Optional[pulumi.ResourceOptions] = None):
    """
    Configures CloudWatch Alarms for various deployed services.
    """
    if opts is None:
      opts = pulumi.ResourceOptions(parent=self)

    # Lambda Error Alarms
    for lambda_name_output in lambda_function_names:
      lambda_name_output.apply(lambda name:
        aws.cloudwatch.MetricAlarm(
          f"{self._name}-{name.replace('-', '')}-errors-alarm",
          name=f"{self._name}-{name}-errors",  # Fixed: Use 'name' instead of 'alarm_name'
          comparison_operator="GreaterThanOrEqualToThreshold",
          evaluation_periods=1,
          metric_name="Errors",
          namespace="AWS/Lambda",
          period=60,
          statistic="Sum",
          threshold=1,
          dimensions={
            "FunctionName": name
          },
          alarm_description=f"Alarm when Lambda function {name} reports errors",
          alarm_actions=[self.sns_topic.arn],
          ok_actions=[self.sns_topic.arn],
          opts=opts
        )
      )

    # Kinesis PutRecord.Errors Alarm
    aws.cloudwatch.MetricAlarm(
      f"{self._name}-kinesis-put-errors-alarm",
      name=f"{self._name}-kinesis-put-record-errors",  # Fixed: Use 'name'
      comparison_operator="GreaterThanOrEqualToThreshold",
      evaluation_periods=1,
      metric_name="PutRecord.Errors",
      namespace="AWS/Kinesis",
      period=60,
      statistic="Sum",
      threshold=1,
      dimensions={
        "StreamName": kinesis_stream_name
      },
      alarm_description="Alarm when Kinesis PutRecord operations experience errors",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      opts=opts
    )

    # CloudFront Error Rate Alarm (only if CloudFront is deployed)
    if cloudfront_distribution_id:
      aws.cloudwatch.MetricAlarm(
        f"{self._name}-cloudfront-error-rate-alarm",
        name=f"{self._name}-cloudfront-error-rate",  # Fixed: Use 'name'
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="4xxErrorRate",
        namespace="AWS/CloudFront",
        period=300,
        statistic="Average",
      threshold=1.0,
      dimensions={
        "DistributionId": cloudfront_distribution_id,
        "Region": "Global"
      },
      alarm_description="Alarm when CloudFront error rate is high",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      opts=opts
    )


