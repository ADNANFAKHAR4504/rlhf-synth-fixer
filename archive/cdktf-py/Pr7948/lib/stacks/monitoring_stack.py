"""Monitoring infrastructure - CloudWatch dashboards and SNS"""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
import json


class MonitoringStack(Construct):
    """Creates CloudWatch dashboards and SNS topics for monitoring"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        api_gateway,
        dynamodb_table,
        aurora_cluster,
        s3_bucket
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix

        # SNS Topics
        self.failover_topic = SnsTopic(
            self,
            "failover-topic",
            name=f"dr-failover-alerts-{region}-{environment_suffix}",
            display_name="Disaster Recovery Failover Alerts",
            tags={
                "Name": f"dr-failover-alerts-{region}-{environment_suffix}"
            }
        )

        self.replication_topic = SnsTopic(
            self,
            "replication-topic",
            name=f"dr-replication-alerts-{region}-{environment_suffix}",
            display_name="Disaster Recovery Replication Alerts",
            tags={
                "Name": f"dr-replication-alerts-{region}-{environment_suffix}"
            }
        )

        # CloudWatch Alarms

        # API Gateway 5xx errors
        CloudwatchMetricAlarm(
            self,
            "api-5xx-alarm",
            alarm_name=f"dr-api-5xx-{region}-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 5xx errors",
            alarm_actions=[self.failover_topic.arn],
            dimensions={
                "ApiId": api_gateway.id
            }
        )

        # DynamoDB replication latency
        # Use table name from object if available, otherwise construct from env suffix
        dynamodb_table_name = dynamodb_table.name if dynamodb_table else f"dr-payments-{environment_suffix}"

        CloudwatchMetricAlarm(
            self,
            "dynamodb-replication-alarm",
            alarm_name=f"dr-dynamodb-replication-{region}-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="ReplicationLatency",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Average",
            threshold=60000,  # 60 seconds
            alarm_description="DynamoDB replication latency high",
            alarm_actions=[self.replication_topic.arn],
            dimensions={
                "TableName": dynamodb_table_name
            }
        )

        # Aurora database connections
        CloudwatchMetricAlarm(
            self,
            "aurora-connections-alarm",
            alarm_name=f"dr-aurora-connections-{region}-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Aurora database connections high",
            alarm_actions=[self.replication_topic.arn],
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            }
        )

        # S3 replication lag
        CloudwatchMetricAlarm(
            self,
            "s3-replication-alarm",
            alarm_name=f"dr-s3-replication-{region}-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="ReplicationLatency",
            namespace="AWS/S3",
            period=300,
            statistic="Maximum",
            threshold=900,  # 15 minutes
            alarm_description="S3 replication latency exceeds RTC threshold",
            alarm_actions=[self.replication_topic.arn],
            dimensions={
                "SourceBucket": s3_bucket.bucket
            }
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "4XXError", {"stat": "Sum"}],
                            [".", "5XXError", {"stat": "Sum"}],
                            [".", "Count", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": region,
                        "title": "API Gateway Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                            [".", "ReplicationLatency", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "DynamoDB Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                            [".", "CPUUtilization", {"stat": "Average"}],
                            [".", "FreeableMemory", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "Aurora Cluster Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/S3", "BytesUploaded", {"stat": "Sum"}],
                            [".", "BytesDownloaded", {"stat": "Sum"}],
                            [".", "ReplicationLatency", {"stat": "Maximum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": "S3 Replication Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "monitoring-dashboard",
            dashboard_name=f"dr-dashboard-{region}-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )
