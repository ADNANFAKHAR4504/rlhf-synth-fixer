"""
CloudWatch monitoring and alarms.
BUG #19: Composite alarm using AND instead of OR logic
BUG #20: Missing SNS alarm actions on individual alarms
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class MonitoringStack(pulumi.ComponentResource):
    """CloudWatch alarms and composite alarm for system health monitoring."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        aurora_cluster_id: Output[str],
        lambda_function_name: Output[str],
        api_gateway_id: Output[str],
        sns_topic_arn: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:MonitoringStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-monitoring-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        # BUG #20: Missing alarm_actions for individual alarms
        # Aurora CPU alarm
        self.aurora_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"aurora-cpu-alarm-{environment_suffix}",
            name=f"trading-aurora-cpu-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when Aurora CPU exceeds 80%",
            dimensions={
                "DBClusterIdentifier": aurora_cluster_id
            },
            # BUG #20: Missing alarm_actions=[sns_topic_arn]
            tags=tags,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{environment_suffix}",
            name=f"trading-lambda-error-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when Lambda errors exceed 10",
            dimensions={
                "FunctionName": lambda_function_name
            },
            # BUG #20: Missing alarm_actions=[sns_topic_arn]
            tags=tags,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # API Gateway 5xx errors alarm
        self.api_error_alarm = aws.cloudwatch.MetricAlarm(
            f"api-error-alarm-{environment_suffix}",
            name=f"trading-api-error-alarm-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=20.0,
            alarm_description="Alert when API Gateway 5xx errors exceed 20",
            dimensions={
                "ApiName": api_gateway_id
            },
            # BUG #20: Missing alarm_actions=[sns_topic_arn]
            tags=tags,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # BUG #19: Composite alarm using AND instead of OR logic
        self.composite_alarm = aws.cloudwatch.CompositeAlarm(
            f"trading-composite-alarm-{environment_suffix}",
            alarm_name=f"trading-system-health-{environment_suffix}",
            alarm_description="Composite alarm for overall system health",
            # BUG #19: Using AND logic when should use OR
            alarm_rule=Output.all(
                self.aurora_cpu_alarm.arn,
                self.lambda_error_alarm.arn,
                self.api_error_alarm.arn
            ).apply(lambda arns:
                f"(ALARM({arns[0]}) AND ALARM({arns[1]}) AND ALARM({arns[2]}))"  # WRONG! Should be OR
            ),
            alarm_actions=[sns_topic_arn],
            tags=tags,
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.composite_alarm_arn = self.composite_alarm.arn

        self.register_outputs({
            'composite_alarm_arn': self.composite_alarm.arn,
            'aurora_cpu_alarm_arn': self.aurora_cpu_alarm.arn,
            'lambda_error_alarm_arn': self.lambda_error_alarm.arn,
            'api_error_alarm_arn': self.api_error_alarm.arn,
        })
