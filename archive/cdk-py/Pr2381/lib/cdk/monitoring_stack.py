"""Monitoring stack with CloudWatch dashboard and alarms."""

from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    Stack,
)
from constructs import Construct


class MonitoringStack(Stack):
    """CDK stack to create monitoring resources."""

    def __init__(self, scope: Construct, construct_id: str, ecs_service, rds_instance, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic
        topic = sns.Topic(self, "AlarmTopic")

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "Dashboard", dashboard_name=f"app-{self.stack_name}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "ServiceName": ecs_service.service_name,
                            "ClusterName": ecs_service.cluster.cluster_name,
                        },
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="MemoryUtilization",
                        dimensions_map={
                            "ServiceName": ecs_service.service_name,
                            "ClusterName": ecs_service.cluster.cluster_name,
                        },
                    ),
                ],
            ),
            cloudwatch.GraphWidget(
                title="RDS Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": rds_instance.instance_identifier,
                        },
                    )
                ],
            ),
        )

        # CloudWatch Alarm
        ecs_failure_alarm = cloudwatch.Alarm(
            self,
            "ECSFailureAlarm",
            alarm_name=f"app-ecs-failure-{self.stack_name}",
            metric=cloudwatch.Metric(
                namespace="AWS/ECS",
                metric_name="HealthCheckFailed",
                dimensions_map={
                    "ServiceName": ecs_service.service_name,
                    "ClusterName": ecs_service.cluster.cluster_name,
                },
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        # Alarm Action
        ecs_failure_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(topic)
        )