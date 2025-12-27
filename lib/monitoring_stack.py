"""
monitoring_stack.py

CloudWatch monitoring and alarms for all infrastructure components.
"""

from typing import Optional, Dict
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import cloudwatch


class MonitoringStack(pulumi.ComponentResource):
    """
    CloudWatch monitoring stack for transaction monitoring system.

    Creates:
    - CloudWatch alarms for Kinesis stream
    - CloudWatch alarms for ElastiCache Redis
    - CloudWatch alarms for RDS PostgreSQL
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        kinesis_stream_name: Output[str],
        elasticache_cluster_id: Output[str],
        rds_instance_id: Output[str],
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        resource_tags = tags or {}

        # Kinesis Stream Alarms
        self.kinesis_iterator_age_alarm = cloudwatch.MetricAlarm(
            f"kinesis-iterator-age-alarm-{environment_suffix}",
            name=f"kinesis-iterator-age-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,  # 1 minute
            alarm_description="Alert when Kinesis iterator age exceeds 1 minute",
            dimensions={
                "StreamName": kinesis_stream_name
            },
            tags={
                **resource_tags,
                'Name': f"kinesis-iterator-age-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.kinesis_write_throughput_alarm = cloudwatch.MetricAlarm(
            f"kinesis-write-throughput-alarm-{environment_suffix}",
            name=f"kinesis-write-throughput-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="WriteProvisionedThroughputExceeded",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Alert when Kinesis write throughput is exceeded",
            dimensions={
                "StreamName": kinesis_stream_name
            },
            tags={
                **resource_tags,
                'Name': f"kinesis-write-throughput-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache Redis Alarms
        self.redis_cpu_alarm = cloudwatch.MetricAlarm(
            f"redis-cpu-alarm-{environment_suffix}",
            name=f"redis-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=75,
            alarm_description="Alert when Redis CPU exceeds 75%",
            dimensions={
                "CacheClusterId": elasticache_cluster_id
            },
            tags={
                **resource_tags,
                'Name': f"redis-cpu-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.redis_memory_alarm = cloudwatch.MetricAlarm(
            f"redis-memory-alarm-{environment_suffix}",
            name=f"redis-memory-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseMemoryUsagePercentage",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=25,  # Alert when less than 25% free memory
            alarm_description="Alert when Redis memory usage is high",
            dimensions={
                "CacheClusterId": elasticache_cluster_id
            },
            tags={
                **resource_tags,
                'Name': f"redis-memory-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # RDS PostgreSQL Alarms
        self.rds_cpu_alarm = cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{environment_suffix}",
            name=f"rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={
                "DBInstanceIdentifier": rds_instance_id
            },
            tags={
                **resource_tags,
                'Name': f"rds-cpu-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.rds_storage_alarm = cloudwatch.MetricAlarm(
            f"rds-storage-alarm-{environment_suffix}",
            name=f"rds-storage-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="FreeStorageSpace",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=2000000000,  # 2GB in bytes
            alarm_description="Alert when RDS free storage is less than 2GB",
            dimensions={
                "DBInstanceIdentifier": rds_instance_id
            },
            tags={
                **resource_tags,
                'Name': f"rds-storage-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.rds_connection_alarm = cloudwatch.MetricAlarm(
            f"rds-connection-alarm-{environment_suffix}",
            name=f"rds-connection-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS connections exceed 80",
            dimensions={
                "DBInstanceIdentifier": rds_instance_id
            },
            tags={
                **resource_tags,
                'Name': f"rds-connection-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            'kinesis_iterator_age_alarm': self.kinesis_iterator_age_alarm.id,
            'kinesis_write_throughput_alarm': self.kinesis_write_throughput_alarm.id,
            'redis_cpu_alarm': self.redis_cpu_alarm.id,
            'redis_memory_alarm': self.redis_memory_alarm.id,
            'rds_cpu_alarm': self.rds_cpu_alarm.id,
            'rds_storage_alarm': self.rds_storage_alarm.id,
            'rds_connection_alarm': self.rds_connection_alarm.id
        })
