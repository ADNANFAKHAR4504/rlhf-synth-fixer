"""
monitoring_stack.py

Monitoring and alerting infrastructure for DR solution.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
import json


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates monitoring and alerting infrastructure.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        compute_target_group: Output,
        database_cluster_id: Output,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # SNS topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"dr-alerts-topic-{environment_suffix}",
            name=f"dr-alerts-topic-{environment_suffix}",
            tags={**tags, 'Name': f'dr-alerts-topic-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for ALB unhealthy targets
        self.alb_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-unhealthy-targets-alarm-{environment_suffix}",
            name=f"alb-unhealthy-targets-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alarm when ALB has unhealthy targets",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TargetGroup": compute_target_group.apply(lambda arn: arn.split(":")[-1])
            },
            tags={**tags, 'Name': f'alb-unhealthy-targets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for RDS CPU
        self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{environment_suffix}",
            name=f"rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when RDS CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": database_cluster_id
            },
            tags={**tags, 'Name': f'rds-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for RDS connections
        self.rds_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-connections-alarm-{environment_suffix}",
            name=f"rds-connections-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=1,
            alarm_description="Alarm when RDS has no connections (possible failure)",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": database_cluster_id
            },
            tags={**tags, 'Name': f'rds-connections-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Route53 health check for primary endpoint
        # Note: Commented out due to missing FQDN - would need ALB DNS passed in
        # For proper DR, this should be enabled with actual endpoint
        # self.health_check = aws.route53.HealthCheck(
        #     f"primary-health-check-{environment_suffix}",
        #     type="HTTPS_STR_MATCH",
        #     fqdn="example.com",  # Would need actual ALB DNS
        #     resource_path="/health",
        #     failure_threshold=3,
        #     request_interval=30,
        #     search_string="active",
        #     measure_latency=True,
        #     tags={**tags, 'Name': f'primary-health-check-{environment_suffix}'},
        #     opts=ResourceOptions(parent=self)
        # )

        # Placeholder health check ID for downstream dependencies
        self.health_check_id = Output.from_input("dummy-health-check-id")

        # CloudWatch Log Group for application logs
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecommerce-logs-{environment_suffix}",
            name=f"/aws/ecommerce/{environment_suffix}",
            retention_in_days=7,
            tags={**tags, 'Name': f'ecommerce-logs-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.sns_topic_arn = self.sns_topic.arn
        # health_check_id already set above as placeholder
        self.log_group_name = self.log_group.name

        self.register_outputs({})
