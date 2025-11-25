"""compliance_monitoring_construct.py
CloudWatch dashboard for compliance metrics.
"""

import aws_cdk as cdk
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_sns as sns
from constructs import Construct


class ComplianceMonitoringConstruct(Construct):
    """
    Monitoring infrastructure for compliance metrics.

    Creates CloudWatch dashboard with metrics for Lambda functions,
    compliance trends, and alerting statistics.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        scanner_lambda: lambda_.Function,
        report_generator_lambda: lambda_.Function,
        alert_topic: sns.Topic
    ):
        super().__init__(scope, construct_id)

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            "ComplianceDashboard",
            dashboard_name=f"compliance-metrics-{environment_suffix}"
        )

        # Scanner Lambda metrics
        scanner_invocations_metric = scanner_lambda.metric_invocations(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        scanner_errors_metric = scanner_lambda.metric_errors(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        scanner_duration_metric = scanner_lambda.metric_duration(
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # Report generator metrics
        report_invocations_metric = report_generator_lambda.metric_invocations(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        report_errors_metric = report_generator_lambda.metric_errors(
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # SNS alert metrics
        alert_published_metric = cloudwatch.Metric(
            namespace="AWS/SNS",
            metric_name="NumberOfMessagesPublished",
            dimensions_map={
                "TopicName": alert_topic.topic_name
            },
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Scanner Function Activity",
                left=[scanner_invocations_metric, scanner_errors_metric],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Scanner Function Duration",
                left=[scanner_duration_metric],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Report Generator Activity",
                left=[report_invocations_metric, report_errors_metric],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Compliance Alerts Published",
                left=[alert_published_metric],
                width=12
            )
        )

        # Alarms for critical Lambda errors
        scanner_error_alarm = cloudwatch.Alarm(
            self,
            "ScannerErrorAlarm",
            alarm_name=f"compliance-scanner-errors-{environment_suffix}",
            metric=scanner_errors_metric,
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when scanner function has multiple errors"
        )

        scanner_error_alarm.add_alarm_action(
            aws_cloudwatch_actions.SnsAction(alert_topic)
        )
