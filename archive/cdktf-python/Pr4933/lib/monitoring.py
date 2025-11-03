"""Monitoring infrastructure for video processing pipeline."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic


class MonitoringConstruct(Construct):
    """Monitoring construct for CloudWatch alarms and SNS notifications."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kinesis_stream_name: str,
        ecs_cluster_name: str,
        ecs_service_name: str,
        db_cluster_id: str,
    ):
        super().__init__(scope, construct_id)

        # Create SNS topic for alerts
        self.sns_topic = SnsTopic(
            self,
            "alert_topic",
            name=f"streamflix-alerts-{environment_suffix}",
            display_name="StreamFlix Video Processing Alerts",
            tags={"Name": f"streamflix-alerts-{environment_suffix}"},
        )

        # Kinesis stream iterator age alarm
        CloudwatchMetricAlarm(
            self,
            "kinesis_iterator_age_alarm",
            alarm_name=f"streamflix-kinesis-iterator-age-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,  # 1 minute
            alarm_description="Kinesis stream iterator age is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name,
            },
            tags={"Name": f"streamflix-kinesis-iterator-age-{environment_suffix}"},
        )

        # Kinesis write throughput exceeded alarm
        CloudwatchMetricAlarm(
            self,
            "kinesis_write_throughput_alarm",
            alarm_name=f"streamflix-kinesis-write-throughput-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteProvisionedThroughputExceeded",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Kinesis stream write throughput exceeded",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name,
            },
            tags={"Name": f"streamflix-kinesis-write-throughput-{environment_suffix}"},
        )

        # ECS CPU utilization alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_cpu_alarm",
            alarm_name=f"streamflix-ecs-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service CPU utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster_name,
                "ServiceName": ecs_service_name,
            },
            tags={"Name": f"streamflix-ecs-cpu-{environment_suffix}"},
        )

        # ECS memory utilization alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_memory_alarm",
            alarm_name=f"streamflix-ecs-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service memory utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster_name,
                "ServiceName": ecs_service_name,
            },
            tags={"Name": f"streamflix-ecs-memory-{environment_suffix}"},
        )

        # RDS CPU utilization alarm
        CloudwatchMetricAlarm(
            self,
            "rds_cpu_alarm",
            alarm_name=f"streamflix-rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS cluster CPU utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id,
            },
            tags={"Name": f"streamflix-rds-cpu-{environment_suffix}"},
        )

        # RDS database connections alarm
        CloudwatchMetricAlarm(
            self,
            "rds_connections_alarm",
            alarm_name=f"streamflix-rds-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS cluster database connections are too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id,
            },
            tags={"Name": f"streamflix-rds-connections-{environment_suffix}"},
        )

    @property
    def sns_topic_arn(self):
        return self.sns_topic.arn
