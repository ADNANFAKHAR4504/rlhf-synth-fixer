from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter, CloudwatchLogMetricFilterMetricTransformation
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, alb, database):
        super().__init__(scope, id)

        # CloudWatch Log Group for Application Logs
        self.app_log_group = CloudwatchLogGroup(self, "app_log_group",
            name=f"/aws/ec2/financial-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-app-logs-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Log Group for ALB Access Logs
        self.alb_log_group = CloudwatchLogGroup(self, "alb_log_group",
            name=f"/aws/alb/financial-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-alb-logs-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Log Group for Database Logs
        self.db_log_group = CloudwatchLogGroup(self, "db_log_group",
            name=f"/aws/rds/cluster/financial-aurora-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"financial-db-logs-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Metric Filter for Error Tracking
        CloudwatchLogMetricFilter(self, "error_metric_filter",
            name=f"financial-error-filter-{environment_suffix}",
            log_group_name=self.app_log_group.name,
            pattern="[time, request_id, event_type = ERROR*, ...]",
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="ApplicationErrors",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # Metric Filter for 4xx Errors
        CloudwatchLogMetricFilter(self, "4xx_metric_filter",
            name=f"financial-4xx-filter-{environment_suffix}",
            log_group_name=self.alb_log_group.name,
            pattern='{ $.status_code = 4* }',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="Errors4xx",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # Metric Filter for 5xx Errors
        CloudwatchLogMetricFilter(self, "5xx_metric_filter",
            name=f"financial-5xx-filter-{environment_suffix}",
            log_group_name=self.alb_log_group.name,
            pattern='{ $.status_code = 5* }',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="Errors5xx",
                namespace=f"Financial/{environment_suffix}",
                value="1",
                default_value="0"
            )
        )

        # SNS Topic for Critical Alerts
        self.alert_topic = SnsTopic(self, "alert_topic",
            name=f"financial-critical-alerts-{environment_suffix}",
            display_name="Financial Platform Critical Alerts",
            tags={
                "Name": f"financial-alerts-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for High Error Rate
        CloudwatchMetricAlarm(self, "error_rate_alarm",
            alarm_name=f"financial-high-error-rate-{environment_suffix}",
            alarm_description="Alert when application error rate is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApplicationErrors",
            namespace=f"Financial/{environment_suffix}",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-error-alarm-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for ALB 5xx Errors
        CloudwatchMetricAlarm(self, "alb_5xx_alarm",
            alarm_name=f"financial-alb-5xx-{environment_suffix}",
            alarm_description="Alert when ALB returns high 5xx errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=50,
            dimensions={
                "LoadBalancer": alb.alb.arn_suffix
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-alb-5xx-alarm-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for Database CPU
        CloudwatchMetricAlarm(self, "db_cpu_alarm",
            alarm_name=f"financial-db-high-cpu-{environment_suffix}",
            alarm_description="Alert when database CPU is high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={
                "DBClusterIdentifier": database.cluster.cluster_identifier
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-db-cpu-alarm-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # CloudWatch Alarm for Database Connections
        CloudwatchMetricAlarm(self, "db_connections_alarm",
            alarm_name=f"financial-db-high-connections-{environment_suffix}",
            alarm_description="Alert when database connections are high",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=100,
            dimensions={
                "DBClusterIdentifier": database.cluster.cluster_identifier
            },
            alarm_actions=[self.alert_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"financial-db-connections-alarm-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )
