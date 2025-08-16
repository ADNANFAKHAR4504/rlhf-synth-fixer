from typing import Optional
import pulumi
import pulumi_aws as aws


class CloudWatchAlarm(pulumi.ComponentResource):
  def __init__(self, name: str,
               bucket_name: pulumi.Output[str],
               sns_topic_arn: pulumi.Output[str],
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:CloudWatchAlarm", name, None, opts)

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
      threshold=5,
      comparison_operator="GreaterThanThreshold",
      dimensions=bucket_name.apply(lambda name: {
        "BucketName": name,
        "FilterId": "EntireBucket"
      }),
      alarm_actions=[sns_topic_arn],
      ok_actions=[sns_topic_arn],
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
      threshold=1000,
      comparison_operator="GreaterThanThreshold",
      dimensions=bucket_name.apply(lambda name: {
        "BucketName": name,
        "FilterId": "EntireBucket"
      }),
      alarm_actions=[sns_topic_arn],
      ok_actions=[sns_topic_arn],
      treat_missing_data="notBreaching",
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "access_denied_alarm_name": self.access_denied_alarm.name,
      "high_request_alarm_name": self.high_request_alarm.name
    })
