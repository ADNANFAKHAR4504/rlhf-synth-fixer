from typing import Optional
import dataclasses
import pulumi
import pulumi_aws as aws


@dataclasses.dataclass
class CloudWatchAlarmConfig:
  bucket_name: pulumi.Output[str]
  sns_topic_arn: pulumi.Output[str]
  error_threshold: int = 5
  request_threshold: int = 1000
  tags: Optional[dict] = None


class CloudWatchAlarm(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: CloudWatchAlarmConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:CloudWatchAlarm", name, None, opts)
    
    # Apply default tags
    default_tags = {
      "Name": f"{name}-cloudwatch-alarms",
      "Component": "CloudWatchAlarm",
      "Purpose": "S3 monitoring and alerting"
    }
    if config.tags:
      default_tags.update(config.tags)
    
    # Validate SNS topic ARN format
    def validate_sns_arn(arn):
      if not arn.startswith('arn:aws:sns:'):
        raise ValueError(f"Invalid SNS topic ARN format: {arn}")
      return arn

    # Create CloudWatch alarm for 4xx errors (failed access attempts)
    self.access_denied_alarm = aws.cloudwatch.MetricAlarm(
      f"{name}-access-denied-alarm",
      name=f"{name}-s3-access-denied",
      alarm_description="Alarm for S3 bucket access denied events",
      metric_name="4xxErrors",
      namespace="AWS/S3",
      statistic="Sum",
      unit="Count",
      period=300,  # 5 minutes
      evaluation_periods=2,
      datapoints_to_alarm=1,
      threshold=config.error_threshold,
      comparison_operator="GreaterThanThreshold",
      dimensions=config.bucket_name.apply(lambda name: {
        "BucketName": name
      }),
      alarm_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      ok_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      tags=default_tags,
      treat_missing_data="notBreaching",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create CloudWatch alarm for high request rate
    self.high_request_alarm = aws.cloudwatch.MetricAlarm(
      f"{name}-high-request-alarm",
      name=f"{name}-s3-high-requests",
      alarm_description="Alarm for unusually high S3 request rate",
      metric_name="AllRequests",
      namespace="AWS/S3",
      statistic="Sum",
      unit="Count",
      period=300,  # 5 minutes
      evaluation_periods=2,
      datapoints_to_alarm=2,
      threshold=config.request_threshold,
      comparison_operator="GreaterThanThreshold",
      dimensions=config.bucket_name.apply(lambda name: {
        "BucketName": name
      }),
      alarm_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      ok_actions=[config.sns_topic_arn.apply(validate_sns_arn)],
      tags=default_tags,
      treat_missing_data="notBreaching",
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "access_denied_alarm_name": self.access_denied_alarm.name,
      "high_request_alarm_name": self.high_request_alarm.name
    })
