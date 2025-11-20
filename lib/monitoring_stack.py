"""monitoring_stack.py
CloudWatch monitoring, alarms, and logging for disaster recovery.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_logs as logs,
    RemovalPolicy
)


class MonitoringStack(Construct):
    """
    Creates CloudWatch monitoring and alarms for RDS replication.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_instance: Primary RDS instance
        replica_instance: Replica RDS instance
        failover_function: Lambda function for failover

    Attributes:
        replication_lag_alarm (cloudwatch.Alarm): Alarm for replication lag
        sns_topic (sns.Topic): SNS topic for alarm notifications
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_instance,
        replica_instance,
        failover_function,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # SNS topic for alarm notifications
        self.sns_topic = sns.Topic(
            self,
            f"AlarmTopic-{environment_suffix}",
            topic_name=f"db-alarms-{environment_suffix}",
            display_name="Database Replication Alarms"
        )

        # CloudWatch alarm for replication lag
        self.replication_lag_alarm = cloudwatch.Alarm(
            self,
            f"ReplicationLagAlarm-{environment_suffix}",
            alarm_name=f"replication-lag-{environment_suffix}",
            alarm_description="Alert when replication lag exceeds 60 seconds",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReplicaLag",
                dimensions_map={
                    "DBInstanceIdentifier": replica_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(1)
            ),
            threshold=60,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING
        )

        self.replication_lag_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for primary database CPU
        primary_cpu_alarm = cloudwatch.Alarm(
            self,
            f"PrimaryCpuAlarm-{environment_suffix}",
            alarm_name=f"primary-cpu-high-{environment_suffix}",
            alarm_description="Alert when primary database CPU exceeds 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": primary_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        primary_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for replica database CPU
        replica_cpu_alarm = cloudwatch.Alarm(
            self,
            f"ReplicaCpuAlarm-{environment_suffix}",
            alarm_name=f"replica-cpu-high-{environment_suffix}",
            alarm_description="Alert when replica database CPU exceeds 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": replica_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        replica_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for failover function errors
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{environment_suffix}",
            alarm_name=f"failover-function-errors-{environment_suffix}",
            alarm_description="Alert when failover function encounters errors",
            metric=failover_function.metric_errors(
                period=cdk.Duration.minutes(1)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )

        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"Dashboard-{environment_suffix}",
            dashboard_name=f"postgres-dr-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Replication Lag",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="ReplicaLag",
                        dimensions_map={
                            "DBInstanceIdentifier": replica_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(1)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="Database CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": primary_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(5),
                        label="Primary"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": replica_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(5),
                        label="Replica"
                    )
                ]
            )
        )
