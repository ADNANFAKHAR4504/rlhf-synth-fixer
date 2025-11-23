"""monitoring_stack.py
CloudWatch dashboards and monitoring stack for cost optimization metrics.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_ecs as ecs,
    aws_apigateway as apigw,
)
from constructs import Construct


class MonitoringStackProps:
    """Properties for Monitoring Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str,
        payment_processor: _lambda.IFunction,
        transaction_validator: _lambda.IFunction,
        fraud_detector: _lambda.IFunction,
        transactions_table: dynamodb.ITable,
        users_table: dynamodb.ITable,
        api: apigw.RestApi,
        ecs_cluster: ecs.ICluster,
        ecs_service_name: str
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.payment_processor = payment_processor
        self.transaction_validator = transaction_validator
        self.fraud_detector = fraud_detector
        self.transactions_table = transactions_table
        self.users_table = users_table
        self.api = api
        self.ecs_cluster = ecs_cluster
        self.ecs_service_name = ecs_service_name


class MonitoringStack(cdk.Stack):
    """
    Monitoring Stack implementing CloudWatch dashboards for cost optimization metrics.
    Requirement 9: Add CloudWatch dashboards to monitor cost optimization metrics
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: MonitoringStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Create comprehensive cost optimization dashboard (Requirement 9)
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"{environment}-payment-dashboard-cost",
            dashboard_name=f"{environment}-payment-cost-optimization"
        )

        # Lambda metrics widget
        lambda_widget = cloudwatch.GraphWidget(
            title="Lambda Cost Optimization Metrics",
            left=[
                props.payment_processor.metric_invocations(statistic="Sum"),
                props.transaction_validator.metric_invocations(statistic="Sum"),
                props.fraud_detector.metric_invocations(statistic="Sum")
            ],
            right=[
                props.payment_processor.metric_duration(statistic="Average"),
                props.transaction_validator.metric_duration(statistic="Average"),
                props.fraud_detector.metric_duration(statistic="Average")
            ]
        )

        # Lambda memory utilization widget
        lambda_memory_widget = cloudwatch.GraphWidget(
            title="Lambda Memory Optimization",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="ConcurrentExecutions",
                    dimensions_map={
                        "FunctionName": props.payment_processor.function_name
                    },
                    statistic="Maximum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="ConcurrentExecutions",
                    dimensions_map={
                        "FunctionName": props.transaction_validator.function_name
                    },
                    statistic="Maximum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="ConcurrentExecutions",
                    dimensions_map={
                        "FunctionName": props.fraud_detector.function_name
                    },
                    statistic="Maximum"
                )
            ]
        )

        # DynamoDB cost metrics widget
        dynamodb_widget = cloudwatch.GraphWidget(
            title="DynamoDB On-Demand Cost Metrics",
            left=[
                props.transactions_table.metric_consumed_read_capacity_units(),
                props.transactions_table.metric_consumed_write_capacity_units(),
                props.users_table.metric_consumed_read_capacity_units(),
                props.users_table.metric_consumed_write_capacity_units()])

        # API Gateway metrics widget
        api_widget = cloudwatch.GraphWidget(
            title="API Gateway Consolidated Metrics",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Count",
                    dimensions_map={
                        "ApiName": props.api.rest_api_name
                    },
                    statistic="Sum"
                ),
                cloudwatch.Metric(
                    namespace="AWS/ApiGateway",
                    metric_name="Latency",
                    dimensions_map={
                        "ApiName": props.api.rest_api_name
                    },
                    statistic="Average"
                )
            ]
        )

        # ECS auto-scaling metrics widget
        ecs_widget = cloudwatch.GraphWidget(
            title="ECS Auto-Scaling Metrics",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "ServiceName": props.ecs_service_name,
                        "ClusterName": props.ecs_cluster.cluster_name
                    },
                    statistic="Average"
                ),
                cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="MemoryUtilization",
                    dimensions_map={
                        "ServiceName": props.ecs_service_name,
                        "ClusterName": props.ecs_cluster.cluster_name
                    },
                    statistic="Average"
                )
            ]
        )

        # Cost savings summary widget
        cost_summary_widget = cloudwatch.SingleValueWidget(
            title="Cost Optimization Summary",
            metrics=[
                cloudwatch.Metric(
                    namespace="AWS/Lambda",
                    metric_name="Invocations",
                    statistic="Sum"
                )
            ],
            width=24
        )

        # Add all widgets to dashboard
        self.dashboard.add_widgets(cost_summary_widget)
        self.dashboard.add_widgets(lambda_widget, lambda_memory_widget)
        self.dashboard.add_widgets(dynamodb_widget, api_widget)
        self.dashboard.add_widgets(ecs_widget)

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.dashboard).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "DashboardName",
            value=self.dashboard.dashboard_name,
            export_name=f"{environment}-payment-dashboard-name"
        )
