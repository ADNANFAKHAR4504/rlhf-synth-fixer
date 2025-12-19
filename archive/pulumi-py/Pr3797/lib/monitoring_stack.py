"""
CloudWatch Monitoring Stack for edge metrics and logging.
"""

import pulumi
from pulumi_aws import cloudwatch
from pulumi import ResourceOptions, Output
from typing import Optional, List


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates CloudWatch dashboards, alarms, and log groups for monitoring.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        distribution_id: Output[str],
        lambda_function_names: List[Output[str]],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # CloudWatch Log Group for Lambda@Edge
        for idx, function_name in enumerate(lambda_function_names):
            cloudwatch.LogGroup(
                f"lambda-edge-log-group-{idx}-{environment_suffix}",
                name=function_name.apply(lambda n: f"/aws/lambda/{n}"),
                retention_in_days=7,
                tags=tags,
                opts=ResourceOptions(parent=self)
            )

        # CloudWatch alarm for CloudFront 4xx errors
        cloudwatch.MetricAlarm(
            f"cloudfront-4xx-alarm-{environment_suffix}",
            name=f"tap-cloudfront-4xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4xxErrorRate",
            namespace="AWS/CloudFront",
            period=300,
            statistic="Average",
            threshold=5.0,
            alarm_description="Alert when CloudFront 4xx error rate exceeds 5%",
            dimensions={
                "DistributionId": distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for CloudFront 5xx errors
        cloudwatch.MetricAlarm(
            f"cloudfront-5xx-alarm-{environment_suffix}",
            name=f"tap-cloudfront-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5xxErrorRate",
            namespace="AWS/CloudFront",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when CloudFront 5xx error rate exceeds 1%",
            dimensions={
                "DistributionId": distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for Lambda@Edge errors
        for idx, function_name in enumerate(lambda_function_names):
            cloudwatch.MetricAlarm(
                f"lambda-edge-error-alarm-{idx}-{environment_suffix}",
                name=function_name.apply(lambda n: f"tap-lambda-{n}-errors-{environment_suffix}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=10,
                alarm_description="Alert when Lambda@Edge function errors exceed 10",
                dimensions={
                    "FunctionName": function_name
                },
                tags=tags,
                opts=ResourceOptions(parent=self)
            )

        self.register_outputs({})
