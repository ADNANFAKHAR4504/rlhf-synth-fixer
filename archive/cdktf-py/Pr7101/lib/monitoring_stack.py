"""Monitoring infrastructure with CloudWatch."""

import json
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """CloudWatch dashboards and alarms."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, aurora_cluster_id: str,
                 lambda_function_name: str, dynamodb_table_name: str):
        super().__init__(scope, construct_id)

        # CloudWatch dashboard
        CloudwatchDashboard(
            self, "dashboard",
            dashboard_name=f"payment-{environment_suffix}",
            dashboard_body=json.dumps({"widgets": [
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", aurora_cluster_id]], "region": region, "title": "Aurora Connections"}},
                {"type": "metric", "properties": {"metrics": [["AWS/Lambda", "Invocations", "FunctionName", lambda_function_name], [".", "Errors", ".", "."]], "region": region, "title": "Lambda Metrics"}},
                {"type": "metric", "properties": {"metrics": [["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", dynamodb_table_name]], "region": region, "title": "DynamoDB Read Capacity"}},
                {"type": "metric", "properties": {"metrics": [["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aurora_cluster_id]], "region": region, "title": "Aurora CPU"}},
            ]}),
            provider=provider,
        )

        # Lambda errors alarm
        CloudwatchMetricAlarm(
            self, "lambda_errors",
            alarm_name=f"payment-lambda-errors-{environment_suffix}",
            alarm_description="Lambda errors for payment processor",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            dimensions={"FunctionName": lambda_function_name},
            tags={"Name": f"payment-lambda-errors-{environment_suffix}"},
            provider=provider,
        )

        # Aurora CPU alarm
        CloudwatchMetricAlarm(
            self, "aurora_cpu",
            alarm_name=f"payment-aurora-cpu-{environment_suffix}",
            alarm_description="Aurora CPU utilization > 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            dimensions={"DBClusterIdentifier": aurora_cluster_id},
            tags={"Name": f"payment-aurora-cpu-{environment_suffix}"},
            provider=provider,
        )

        # DynamoDB throttling alarm
        CloudwatchMetricAlarm(
            self, "dynamodb_throttles",
            alarm_name=f"payment-dynamodb-throttles-{environment_suffix}",
            alarm_description="DynamoDB read throttles",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            dimensions={"TableName": dynamodb_table_name},
            tags={"Name": f"payment-dynamodb-throttles-{environment_suffix}"},
            provider=provider,
        )
