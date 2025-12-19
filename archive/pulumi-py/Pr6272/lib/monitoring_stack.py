"""
monitoring_stack.py

CloudWatch monitoring infrastructure module.
Creates dashboards, alarms, and metric filters for migration monitoring.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class MonitoringStackArgs:
    """Arguments for MonitoringStack component."""

    def __init__(
        self,
        environment_suffix: str,
        production_cluster_id: Output[str],
        migration_cluster_id: Output[str],
        dms_replication_task_arn: Output[str],
        validation_lambda_name: Output[str],
        api_gateway_id: Output[str],
        migration_state_machine_arn: Output[str],
        error_alerts_topic_arn: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.production_cluster_id = production_cluster_id
        self.migration_cluster_id = migration_cluster_id
        self.dms_replication_task_arn = dms_replication_task_arn
        self.validation_lambda_name = validation_lambda_name
        self.api_gateway_id = api_gateway_id
        self.migration_state_machine_arn = migration_state_machine_arn
        self.error_alerts_topic_arn = error_alerts_topic_arn
        self.tags = tags or {}


class MonitoringStack(pulumi.ComponentResource):
    """
    CloudWatch monitoring infrastructure for migration project.

    Creates:
    - CloudWatch Dashboard for migration metrics
    - CloudWatch Alarms for critical metrics
    - Metric Filters for log analysis
    - Composite alarms for complex conditions
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Monitoring'
        }

        # CloudWatch Dashboard
        self.dashboard = self._create_dashboard(args)

        # RDS Aurora Alarms
        self._create_rds_alarms(args)

        # DMS Alarms
        self._create_dms_alarms(args)

        # Lambda Alarms
        self._create_lambda_alarms(args)

        # Step Functions Alarms
        self._create_stepfunctions_alarms(args)

        # API Gateway Alarms
        self._create_api_gateway_alarms(args)

        # Metric Filters
        self._create_metric_filters(args)

        # Register outputs
        self.register_outputs({
            'dashboard_name': self.dashboard.dashboard_name,
            'dashboard_arn': self.dashboard.dashboard_arn
        })

    def _create_dashboard(self, args: MonitoringStackArgs) -> aws.cloudwatch.Dashboard:
        """Create CloudWatch dashboard for migration monitoring."""

        dashboard_body = Output.all(
            args.production_cluster_id,
            args.migration_cluster_id,
            args.validation_lambda_name,
            args.api_gateway_id,
            Output.from_input(aws.get_region().name or "us-east-1")
        ).apply(lambda vals: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average", "label": "Production DB CPU"}],
                            ["...", {"stat": "Average", "label": "Migration DB CPU"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "Database CPU Utilization",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "label": "Production Connections"}],
                            ["...", {"stat": "Average", "label": "Migration Connections"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "Database Connections",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DMS", "FullLoadThroughputRowsTarget", {"stat": "Average"}],
                            [".", "CDCLatencySource", {"stat": "Average"}],
                            [".", "CDCLatencyTarget", {"stat": "Average"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "DMS Replication Metrics",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations"],
                            [".", "Errors"],
                            [".", "Duration"]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "Data Validation Lambda Metrics",
                        "period": 300,
                        "stat": "Sum",
                        "dimensions": {
                            "FunctionName": vals[2]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count"],
                            [".", "4XXError"],
                            [".", "5XXError"],
                            [".", "Latency"]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "API Gateway Metrics",
                        "period": 300,
                        "stat": "Sum",
                        "dimensions": {
                            "ApiName": vals[3]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["Migration/DataValidation", "ValidationStatus", {"stat": "Average"}],
                            [".", "DiscrepancyCount", {"stat": "Sum"}],
                            [".", "TablesValidated", {"stat": "Sum"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": vals[4],
                        "title": "Data Validation Results",
                        "period": 300
                    }
                }
            ]
        }))

        return aws.cloudwatch.Dashboard(
            f"migration-dashboard-{self.environment_suffix}",
            dashboard_name=f"migration-dashboard-{self.environment_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self)
        )

    def _create_rds_alarms(self, args: MonitoringStackArgs):
        """Create CloudWatch alarms for RDS metrics."""

        # Production DB CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f"prod-db-cpu-alarm-{self.environment_suffix}",
            name=f"prod-db-high-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Production database CPU exceeds 80%",
            alarm_actions=[args.error_alerts_topic_arn],
            dimensions={
                "DBClusterIdentifier": args.production_cluster_id
            },
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"prod-db-cpu-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Migration DB CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f"migration-db-cpu-alarm-{self.environment_suffix}",
            name=f"migration-db-high-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Migration database CPU exceeds 80%",
            alarm_actions=[args.error_alerts_topic_arn],
            dimensions={
                "DBClusterIdentifier": args.migration_cluster_id
            },
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"migration-db-cpu-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_dms_alarms(self, args: MonitoringStackArgs):
        """Create CloudWatch alarms for DMS metrics."""

        # DMS Replication Lag Alarm
        aws.cloudwatch.MetricAlarm(
            f"dms-replication-lag-alarm-{self.environment_suffix}",
            name=f"dms-high-replication-lag-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencyTarget",
            namespace="AWS/DMS",
            period=300,
            statistic="Average",
            threshold=300.0,  # 5 minutes
            alarm_description="DMS replication lag exceeds 5 minutes",
            alarm_actions=[args.error_alerts_topic_arn],
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"dms-replication-lag-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_alarms(self, args: MonitoringStackArgs):
        """Create CloudWatch alarms for Lambda metrics."""

        # Lambda Error Rate Alarm
        aws.cloudwatch.MetricAlarm(
            f"validation-lambda-errors-alarm-{self.environment_suffix}",
            name=f"validation-lambda-high-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5.0,
            alarm_description="Data validation Lambda errors exceed threshold",
            alarm_actions=[args.error_alerts_topic_arn],
            dimensions={
                "FunctionName": args.validation_lambda_name
            },
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"validation-lambda-errors-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_stepfunctions_alarms(self, args: MonitoringStackArgs):
        """Create CloudWatch alarms for Step Functions metrics."""

        # Step Functions Execution Failed Alarm
        aws.cloudwatch.MetricAlarm(
            f"stepfunctions-failed-alarm-{self.environment_suffix}",
            name=f"migration-workflow-failures-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ExecutionsFailed",
            namespace="AWS/States",
            period=300,
            statistic="Sum",
            threshold=0.0,
            alarm_description="Migration workflow execution failed",
            alarm_actions=[args.error_alerts_topic_arn],
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"stepfunctions-failed-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_api_gateway_alarms(self, args: MonitoringStackArgs):
        """Create CloudWatch alarms for API Gateway metrics."""

        # API Gateway 5XX Error Alarm
        aws.cloudwatch.MetricAlarm(
            f"api-5xx-errors-alarm-{self.environment_suffix}",
            name=f"api-high-5xx-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="API Gateway 5XX errors exceed threshold",
            alarm_actions=[args.error_alerts_topic_arn],
            dimensions={
                "ApiName": args.api_gateway_id
            },
            treat_missing_data="notBreaching",
            tags={
                **self.tags,
                'Name': f"api-5xx-errors-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_metric_filters(self, args: MonitoringStackArgs):
        """Create CloudWatch metric filters for log analysis."""

        # DMS Error Metric Filter
        dms_log_group = aws.cloudwatch.LogGroup(
            f"dms-metric-filter-log-group-{self.environment_suffix}",
            name=f"/aws/dms/migration-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                'Name': f"dms-metric-filter-log-group-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.LogMetricFilter(
            f"dms-error-metric-filter-{self.environment_suffix}",
            name=f"dms-errors-{self.environment_suffix}",
            log_group_name=dms_log_group.name,
            pattern="[ERROR]",
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                name="DMSErrors",
                namespace="Migration/DMS",
                value="1",
                default_value="0"
            ),
            opts=ResourceOptions(parent=dms_log_group)
        )
