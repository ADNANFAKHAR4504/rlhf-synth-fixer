# lib/components/monitoring.py

import pulumi
import pulumi_aws as aws
import json
from typing import List, Optional
import os

"""
Monitoring Infrastructure Component (LocalStack Community Compatible)

NOTE: SNS and CloudWatch Alarms are NOT available in LocalStack Community Edition.
This component creates mock/placeholder resources to allow the stack to deploy.
"""

# Detect if running in LocalStack
is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') != -1 or \
                os.environ.get('AWS_ENDPOINT_URL', '').find('4566') != -1

class MonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, tags: dict, opts=None):
    super().__init__("custom:monitoring:Infrastructure", name, None, opts)

    # SNS is NOT available in LocalStack Community - create mock ARN
    # In a real LocalStack Pro or AWS deployment, this would be a real SNS topic
    # For Community, we'll use a placeholder ARN that won't actually be used
    if is_localstack:
      # Create a mock SNS topic ARN for LocalStack Community
      # This allows the stack to deploy without SNS support
      self.sns_topic_arn = pulumi.Output.concat("arn:aws:sns:us-east-1:000000000000:", name, "-alerts-mock")
      pulumi.log.warn("SNS is not available in LocalStack Community - using mock ARN")
    else:
      # For real AWS deployments, create actual SNS topic
      self.sns_topic = aws.sns.Topic(
        f"{name}-alerts-topic",
        name=f"{name}-alerts",
        tags=tags,
        opts=pulumi.ResourceOptions(parent=self)
      )
      self.sns_topic_arn = self.sns_topic.arn

      self.sns_topic_subscription = aws.sns.TopicSubscription(
        f"{name}-email-subscription",
        topic=self.sns_topic.arn,
        protocol="email",
        endpoint="your-alert-email@example.com",
        opts=pulumi.ResourceOptions(parent=self, depends_on=[self.sns_topic])
      )

    self.register_outputs({
      "sns_topic_arn": self.sns_topic_arn,
    })

  def setup_alarms(self,
                   lambda_function_names: List[pulumi.Output] = None,
                   kinesis_stream_name: pulumi.Output = None,
                   cloudfront_distribution_id: pulumi.Output = None,
                   opts: Optional[pulumi.ResourceOptions] = None):
    """
    Configures CloudWatch Alarms (only in real AWS, not LocalStack Community).

    LocalStack Community does not support:
    - CloudWatch Alarms
    - CloudWatch Metrics
    - SNS notifications

    This method is a no-op in LocalStack Community to allow deployment.
    """
    if opts is None:
      opts = pulumi.ResourceOptions(parent=self)

    if is_localstack:
      pulumi.log.warn("CloudWatch Alarms are not available in LocalStack Community - skipping alarm creation")
      return

    # Only create alarms in real AWS deployments
    # Lambda Error Alarms
    if lambda_function_names:
      for lambda_name_output in lambda_function_names:
        lambda_name_output.apply(lambda name:
          aws.cloudwatch.MetricAlarm(
            f"{self._name}-{name.replace('-', '')}-errors-alarm",
            name=f"{self._name}-{name}-errors",
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
            alarm_actions=[self.sns_topic_arn],
            ok_actions=[self.sns_topic_arn],
            opts=opts
          )
        )

    # Kinesis PutRecord.Errors Alarm
    if kinesis_stream_name:
      aws.cloudwatch.MetricAlarm(
        f"{self._name}-kinesis-put-errors-alarm",
        name=f"{self._name}-kinesis-put-record-errors",
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
        alarm_actions=[self.sns_topic_arn],
        ok_actions=[self.sns_topic_arn],
        opts=opts
      )

    # CloudFront Error Rate Alarm
    if cloudfront_distribution_id:
      aws.cloudwatch.MetricAlarm(
        f"{self._name}-cloudfront-error-rate-alarm",
        name=f"{self._name}-cloudfront-error-rate",
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
        alarm_actions=[self.sns_topic_arn],
        ok_actions=[self.sns_topic_arn],
        opts=opts
      )
