"""monitoring_construct.py

Custom CDK construct for CloudWatch monitoring.
"""

from typing import Dict, Any
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_sqs as sqs,
    aws_sns as sns,
    Duration,
)
from constructs import Construct


class MonitoringConstruct(Construct):
    """Custom construct for CloudWatch monitoring."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        environment_name: str,
        alb: elbv2.ApplicationLoadBalancer,
        ecs_service: ecs.FargateService,
        aurora_cluster: rds.DatabaseCluster,
        queue: sqs.Queue,
        alarm_thresholds: Dict[str, Any],
        **kwargs
    ):
        super().__init__(scope, construct_id)

        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{environment_suffix}",
            topic_name=f"payment-alarms-{environment_suffix}",
            display_name=f"Payment Alarms - {environment_name}"
        )

        dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{environment_suffix}",
            dashboard_name=f"payment-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    alb.metric_request_count(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="ECS CPU Utilization",
                left=[
                    ecs_service.metric_cpu_utilization(
                        statistic="Average",
                        period=Duration.minutes(5)
                    )
                ]
            )
        )

        ecs_cpu_metric = ecs_service.metric_cpu_utilization()

        cloudwatch.Alarm(
            self,
            f"EcsCpuAlarm-{environment_suffix}",
            metric=ecs_cpu_metric,
            threshold=alarm_thresholds["cpu_threshold"],
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_name=f"payment-ecs-cpu-{environment_suffix}"
        ).add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))
