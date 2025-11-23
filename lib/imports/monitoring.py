from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_db_cluster_id: str,
        secondary_db_cluster_id: str,
        primary_lambda_name: str,
        secondary_lambda_name: str,
        dynamodb_table_name: str
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # SNS Topic for alerts
        self.sns_topic = SnsTopic(
            self,
            "alerts_topic",
            name=f"payment-alerts-{environment_suffix}",
            display_name="Payment System Alerts",
            tags={
                "Name": f"payment-alerts-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # SNS subscription (email)
        SnsTopicSubscription(
            self,
            "alerts_subscription",
            topic_arn=self.sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=primary_provider
        )

        # Primary Aurora CPU alarm
        CloudwatchMetricAlarm(
            self,
            "primary_db_cpu_alarm",
            alarm_name=f"payment-primary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary database CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": primary_db_cluster_id
            },
            tags={
                "Name": f"payment-primary-db-cpu-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Secondary Aurora CPU alarm
        CloudwatchMetricAlarm(
            self,
            "secondary_db_cpu_alarm",
            alarm_name=f"payment-secondary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when secondary database CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_db_cluster_id
            },
            tags={
                "Name": f"payment-secondary-db-cpu-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Primary Lambda errors alarm
        CloudwatchMetricAlarm(
            self,
            "primary_lambda_errors",
            alarm_name=f"payment-primary-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when primary Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": primary_lambda_name
            },
            tags={
                "Name": f"payment-primary-lambda-errors-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Secondary Lambda errors alarm
        CloudwatchMetricAlarm(
            self,
            "secondary_lambda_errors",
            alarm_name=f"payment-secondary-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when secondary Lambda errors exceed threshold",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": secondary_lambda_name
            },
            tags={
                "Name": f"payment-secondary-lambda-errors-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # DynamoDB read throttle alarm
        CloudwatchMetricAlarm(
            self,
            "dynamodb_read_throttle",
            alarm_name=f"payment-dynamodb-read-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when DynamoDB read throttling occurs",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TableName": dynamodb_table_name
            },
            tags={
                "Name": f"payment-dynamodb-read-throttle-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Replication lag alarm for Aurora Global Database
        CloudwatchMetricAlarm(
            self,
            "aurora_replication_lag",
            alarm_name=f"payment-aurora-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Maximum",
            threshold=5000,
            alarm_description="Alert when Aurora replication lag exceeds 5 seconds",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": secondary_db_cluster_id
            },
            tags={
                "Name": f"payment-aurora-replication-lag-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

    @property
    def sns_topic_arn(self):
        return self.sns_topic.arn
