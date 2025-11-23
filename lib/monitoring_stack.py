"""Monitoring infrastructure with CloudWatch."""

import json
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """CloudWatch dashboards and alarms."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_aurora_cluster_id: str, secondary_aurora_cluster_id: str,
                 primary_lambda_function_name: str, secondary_lambda_function_name: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        # Primary dashboard
        CloudwatchDashboard(
            self, "primary_dashboard",
            dashboard_name=f"payment-primary-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections"]], "region": primary_region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations"], [".", "Errors"]], "region": primary_region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits"]], "region": primary_region, "title": "DynamoDB"}},
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "AuroraGlobalDBReplicationLag"]], "region": primary_region, "title": "Replication Lag"}},
            ]}),
            provider=primary_provider,
        )

        # Secondary dashboard
        CloudwatchDashboard(
            self, "secondary_dashboard",
            dashboard_name=f"payment-secondary-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections"]], "region": secondary_region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations"], [".", "Errors"]], "region": secondary_region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits"]], "region": secondary_region, "title": "DynamoDB"}},
            ]}),
            provider=secondary_provider,
        )

        # Alarms
        CloudwatchMetricAlarm(
            self, "replication_lag_alarm",
            alarm_name=f"payment-replication-lag-{environment_suffix}",
            alarm_description="Aurora Global DB replication lag > 60s",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60000,
            treat_missing_data="notBreaching",
            dimensions={"DBClusterIdentifier": primary_aurora_cluster_id},
            tags={"Name": f"payment-replication-lag-{environment_suffix}"},
            provider=primary_provider,
        )

        for region, lambda_name, region_provider in [
            ("primary", primary_lambda_function_name, primary_provider),
            ("secondary", secondary_lambda_function_name, secondary_provider),
        ]:
            CloudwatchMetricAlarm(
                self, f"{region}_lambda_errors",
                alarm_name=f"payment-lambda-errors-{region}-{environment_suffix}",
                alarm_description=f"Lambda errors in {region}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=10,
                dimensions={"FunctionName": lambda_name},
                tags={"Name": f"payment-lambda-errors-{region}-{environment_suffix}"},
                provider=region_provider,
            )