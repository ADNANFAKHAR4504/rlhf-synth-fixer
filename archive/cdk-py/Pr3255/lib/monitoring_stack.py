"""monitoring_stack.py
This module defines CloudWatch monitoring and alarms.
"""

from typing import Optional
from constructs import Construct
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    Duration,
)


class MonitoringStackProps:
    """Properties for MonitoringStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        api: apigateway.RestApi = None,
        lambda_function: lambda_.Function = None,
        table: dynamodb.Table = None,
    ):
        self.environment_suffix = environment_suffix
        self.api = api
        self.lambda_function = lambda_function
        self.table = table


class MonitoringStack(Construct):
    """Stack for CloudWatch monitoring and alarms."""

    def __init__(
        self, scope: Construct, construct_id: str, props: MonitoringStackProps = None
    ):
        super().__init__(scope, construct_id)

        suffix = props.environment_suffix if props else "dev"

        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"ReviewsDashboard{suffix}", dashboard_name=f"ProductReviews-{suffix}"
        )

        if props and props.api:
            # API Gateway metrics
            api_requests = cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="Count",
                dimensions_map={"ApiName": props.api.rest_api_name, "Stage": suffix},
                statistic="Sum",
            )

            api_latency = cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="Latency",
                dimensions_map={"ApiName": props.api.rest_api_name, "Stage": suffix},
                statistic="Average",
            )

            api_4xx_errors = cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={"ApiName": props.api.rest_api_name, "Stage": suffix},
                statistic="Sum",
            )

            # Add API widgets to dashboard
            dashboard.add_widgets(
                cloudwatch.GraphWidget(title="API Request Count", left=[api_requests]),
                cloudwatch.GraphWidget(title="API Latency", left=[api_latency]),
            )

            # Create 4xx error rate alarm
            cloudwatch.Alarm(
                self,
                f"Api4xxErrorAlarm{suffix}",
                alarm_name=f"API-4xx-Errors-{suffix}",
                alarm_description="Alarm when 4xx errors exceed 10% of requests",
                metric=cloudwatch.MathExpression(
                    expression="(errors / requests) * 100",
                    using_metrics={"errors": api_4xx_errors, "requests": api_requests},
                ),
                threshold=10,
                evaluation_periods=2,
                datapoints_to_alarm=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            )

        if props and props.lambda_function:
            # Lambda metrics
            lambda_invocations = cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Invocations",
                dimensions_map={"FunctionName": props.lambda_function.function_name},
                statistic="Sum",
            )

            lambda_errors = cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={"FunctionName": props.lambda_function.function_name},
                statistic="Sum",
            )

            lambda_duration = cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Duration",
                dimensions_map={"FunctionName": props.lambda_function.function_name},
                statistic="Average",
            )

            # Add Lambda widgets to dashboard
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="Lambda Invocations", left=[lambda_invocations]
                ),
                cloudwatch.GraphWidget(title="Lambda Duration", left=[lambda_duration]),
                cloudwatch.GraphWidget(title="Lambda Errors", left=[lambda_errors]),
            )

        if props and props.table:
            # DynamoDB metrics
            read_capacity = cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="ConsumedReadCapacityUnits",
                dimensions_map={"TableName": props.table.table_name},
                statistic="Sum",
            )

            write_capacity = cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="ConsumedWriteCapacityUnits",
                dimensions_map={"TableName": props.table.table_name},
                statistic="Sum",
            )

            # Add DynamoDB widgets to dashboard
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="DynamoDB Read Capacity", left=[read_capacity]
                ),
                cloudwatch.GraphWidget(
                    title="DynamoDB Write Capacity", left=[write_capacity]
                ),
            )
