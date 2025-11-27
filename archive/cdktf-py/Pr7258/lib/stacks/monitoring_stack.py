"""Monitoring Stack - CloudWatch dashboards and alarms."""

from typing import Dict, List, Any
from cdktf import Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringConstruct(Construct):
    """Monitoring Construct with CloudWatch dashboards and alarms."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        alb_arn_suffix: str,
        lambda_function_name: str,
        db_cluster_id: str,
        dms_task_arn: str,
        **kwargs: Any
    ) -> None:
        """Initialize Monitoring construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            alb_arn_suffix: ALB ARN suffix for metrics
            lambda_function_name: Lambda function name
            db_cluster_id: RDS cluster identifier
            dms_task_arn: DMS replication task ARN
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create SNS topic for alarms
        self.alarm_topic = SnsTopic(
            self,
            f"alarm-topic-{environment_suffix}",
            name=f"payment-alarms-{environment_suffix}",
            display_name="Payment System Alarms",
            tags={
                "Name": f"payment-alarms-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create CloudWatch dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                            [".", "RequestCount", {"stat": "Sum"}],
                            [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum"}],
                            [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "ALB Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}],
                            [".", "Throttles", {"stat": "Sum"}],
                            [".", "ConcurrentExecutions", {"stat": "Maximum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Lambda Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                            [".", "CPUUtilization", {"stat": "Average"}],
                            [".", "FreeableMemory", {"stat": "Average"}],
                            [".", "ReadLatency", {"stat": "Average"}],
                            [".", "WriteLatency", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "RDS Metrics",
                        "yAxis": {"left": {"min": 0}}
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DMS", "FullLoadThroughputRowsSource", {"stat": "Average"}],
                            [".", "FullLoadThroughputRowsTarget", {"stat": "Average"}],
                            [".", "CDCLatencySource", {"stat": "Average"}],
                            [".", "CDCLatencyTarget", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "DMS Migration Progress",
                        "yAxis": {"left": {"min": 0}}
                    }
                }
            ]
        }

        self.dashboard = CloudwatchDashboard(
            self,
            f"dashboard-{environment_suffix}",
            dashboard_name=f"payment-migration-{environment_suffix}",
            dashboard_body=Fn.jsonencode(dashboard_body)
        )

        # Create CloudWatch alarms

        # ALB latency alarm
        CloudwatchMetricAlarm(
            self,
            f"alb-latency-alarm-{environment_suffix}",
            alarm_name=f"payment-alb-latency-{environment_suffix}",
            alarm_description="ALB response time exceeds 1 second",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-alb-latency-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Lambda error rate alarm
        CloudwatchMetricAlarm(
            self,
            f"lambda-error-alarm-{environment_suffix}",
            alarm_name=f"payment-lambda-errors-{environment_suffix}",
            alarm_description="Lambda error rate exceeds 5%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "FunctionName": lambda_function_name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-lambda-errors-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # RDS CPU utilization alarm
        CloudwatchMetricAlarm(
            self,
            f"rds-cpu-alarm-{environment_suffix}",
            alarm_name=f"payment-rds-cpu-{environment_suffix}",
            alarm_description="RDS CPU utilization exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-rds-cpu-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # RDS Database Connections alarm
        CloudwatchMetricAlarm(
            self,
            f"rds-connections-alarm-{environment_suffix}",
            alarm_name=f"payment-rds-connections-{environment_suffix}",
            alarm_description="RDS database connections exceed 80% of max",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-rds-connections-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # ALB Latency alarm for integration test
        CloudwatchMetricAlarm(
            self,
            f"alb-latency-test-alarm-{environment_suffix}",
            alarm_name=f"payment-alb-latency-test-{environment_suffix}",
            alarm_description="ALB latency for testing",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-alb-latency-test-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS replication lag alarm
        CloudwatchMetricAlarm(
            self,
            f"dms-lag-alarm-{environment_suffix}",
            alarm_name=f"payment-dms-lag-{environment_suffix}",
            alarm_description="DMS replication lag exceeds 60 seconds",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencyTarget",
            namespace="AWS/DMS",
            period=300,
            statistic="Average",
            threshold=60.0,
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-dms-lag-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

    def get_alarm_topic_arn(self) -> str:
        """Get SNS alarm topic ARN."""
        return self.alarm_topic.arn

    def get_dashboard_name(self) -> str:
        """Get CloudWatch dashboard name."""
        return self.dashboard.dashboard_name
