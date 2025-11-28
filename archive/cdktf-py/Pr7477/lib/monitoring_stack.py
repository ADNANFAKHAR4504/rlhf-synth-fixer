"""Monitoring stack for CloudWatch and SNS."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringStack(Construct):
    """CloudWatch monitoring and SNS alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_cluster_id: str,
        secondary_cluster_id: str,
    ):
        """Initialize monitoring infrastructure in both regions."""
        super().__init__(scope, construct_id)

        # Create SNS topic in primary region
        primary_sns_topic = SnsTopic(
            self,
            "primary_sns_topic",
            provider=primary_provider,
            name=f"aurora-failover-primary-{environment_suffix}",
            display_name="Aurora Primary Region Alerts",
            tags={
                "Name": f"aurora-failover-primary-{environment_suffix}",
            },
        )

        # Create SNS topic in secondary region
        secondary_sns_topic = SnsTopic(
            self,
            "secondary_sns_topic",
            provider=secondary_provider,
            name=f"aurora-failover-secondary-{environment_suffix}",
            display_name="Aurora Secondary Region Alerts",
            tags={
                "Name": f"aurora-failover-secondary-{environment_suffix}",
            },
        )

        # Create CloudWatch alarm for primary cluster replication lag
        primary_replication_alarm = CloudwatchMetricAlarm(
            self,
            "primary_replication_alarm",
            provider=primary_provider,
            alarm_name=f"aurora-primary-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=500,  # 500ms threshold
            alarm_description="Alert when primary cluster replication lag exceeds 500ms",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_cluster_id,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"aurora-primary-replication-lag-{environment_suffix}",
            },
        )

        # Create CloudWatch alarm for primary cluster CPU
        primary_cpu_alarm = CloudwatchMetricAlarm(
            self,
            "primary_cpu_alarm",
            provider=primary_provider,
            alarm_name=f"aurora-primary-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary cluster CPU exceeds 80%",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_cluster_id,
            },
            tags={
                "Name": f"aurora-primary-cpu-{environment_suffix}",
            },
        )

        # Create CloudWatch alarm for primary cluster connections
        primary_connections_alarm = CloudwatchMetricAlarm(
            self,
            "primary_connections_alarm",
            provider=primary_provider,
            alarm_name=f"aurora-primary-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=100,
            alarm_description="Alert when primary cluster connections exceed 100",
            alarm_actions=[primary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_cluster_id,
            },
            tags={
                "Name": f"aurora-primary-connections-{environment_suffix}",
            },
        )

        # Create CloudWatch alarm for secondary cluster CPU
        secondary_cpu_alarm = CloudwatchMetricAlarm(
            self,
            "secondary_cpu_alarm",
            provider=secondary_provider,
            alarm_name=f"aurora-secondary-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when secondary cluster CPU exceeds 80%",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_cluster_id,
            },
            tags={
                "Name": f"aurora-secondary-cpu-{environment_suffix}",
            },
        )

        # Create CloudWatch alarm for secondary cluster connections
        secondary_connections_alarm = CloudwatchMetricAlarm(
            self,
            "secondary_connections_alarm",
            provider=secondary_provider,
            alarm_name=f"aurora-secondary-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=100,
            alarm_description="Alert when secondary cluster connections exceed 100",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_cluster_id,
            },
            tags={
                "Name": f"aurora-secondary-connections-{environment_suffix}",
            },
        )

        # Export attributes for use in other stacks
        self.primary_sns_topic_arn = primary_sns_topic.arn
        self.secondary_sns_topic_arn = secondary_sns_topic.arn
        self.primary_replication_alarm = primary_replication_alarm
        self.secondary_cpu_alarm = secondary_cpu_alarm