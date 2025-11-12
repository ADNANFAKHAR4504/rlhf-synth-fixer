"""
Monitoring infrastructure - CloudWatch dashboards, metrics, and alarms.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions
)
from constructs import Construct
from typing import List


class MonitoringStackProps:
    """Properties for MonitoringStack."""

    def __init__(
        self,
        environment_suffix: str,
        alb: elbv2.ApplicationLoadBalancer,
        ecs_service: ecs.FargateService,
        database: rds.DatabaseCluster,
        lambda_functions: List[lambda_.Function],
        api: apigw.RestApi
    ):
        self.environment_suffix = environment_suffix
        self.alb = alb
        self.ecs_service = ecs_service
        self.database = database
        self.lambda_functions = lambda_functions
        self.api = api


class MonitoringStack(NestedStack):
    """CloudWatch monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: MonitoringStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # SNS Topic for alarms
        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{env_suffix}",
            topic_name=f"payment-alarms-{env_suffix}",
            display_name="Payment Processing Alarms"
        )

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{env_suffix}",
            dashboard_name=f"payment-dashboard-{env_suffix}"
        )

        # ALB Metrics
        alb_target_response_time = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="TargetResponseTime",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        alb_request_count = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="RequestCount",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        alb_target_errors = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="HTTPCode_Target_5XX_Count",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        # ECS Metrics
        ecs_cpu = props.ecs_service.metric_cpu_utilization(
            period=Duration.minutes(1)
        )

        ecs_memory = props.ecs_service.metric_memory_utilization(
            period=Duration.minutes(1)
        )

        # Database Metrics
        db_cpu = props.database.metric_cpu_utilization(
            period=Duration.minutes(1)
        )

        db_connections = props.database.metric_database_connections(
            period=Duration.minutes(1)
        )

        # API Gateway Metrics
        api_requests = props.api.metric_count(
            period=Duration.minutes(1)
        )

        api_latency = props.api.metric_latency(
            period=Duration.minutes(1)
        )

        api_errors = props.api.metric_server_error(
            period=Duration.minutes(1)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Performance",
                left=[alb_request_count],
                right=[alb_target_response_time],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="ALB Errors",
                left=[alb_target_errors],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Resource Utilization",
                left=[ecs_cpu, ecs_memory],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Database Performance",
                left=[db_cpu],
                right=[db_connections],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[api_requests],
                right=[api_latency],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Errors",
                left=[api_errors],
                width=12
            )
        )

        # Lambda metrics
        for i, lambda_fn in enumerate(props.lambda_functions):
            lambda_errors = lambda_fn.metric_errors(
                period=Duration.minutes(1)
            )
            lambda_duration = lambda_fn.metric_duration(
                period=Duration.minutes(1)
            )

            self.dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title=f"Lambda Function {i}",
                    left=[lambda_errors],
                    right=[lambda_duration],
                    width=12
                )
            )

        # Custom metrics for transaction processing
        transaction_processing_time = cloudwatch.Metric(
            namespace=f"PaymentProcessing/{env_suffix}",
            metric_name="TransactionProcessingTime",
            statistic="Average",
            period=Duration.minutes(1)
        )

        transaction_success_rate = cloudwatch.Metric(
            namespace=f"PaymentProcessing/{env_suffix}",
            metric_name="TransactionSuccessRate",
            statistic="Average",
            period=Duration.minutes(1)
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Transaction Metrics",
                left=[transaction_processing_time],
                right=[transaction_success_rate],
                width=24
            )
        )

        # Alarms
        # High ALB response time
        cloudwatch.Alarm(
            self,
            f"HighResponseTimeAlarm-{env_suffix}",
            alarm_name=f"payment-high-response-time-{env_suffix}",
            metric=alb_target_response_time,
            threshold=1000,  # 1 second
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High error rate
        cloudwatch.Alarm(
            self,
            f"HighErrorRateAlarm-{env_suffix}",
            alarm_name=f"payment-high-error-rate-{env_suffix}",
            metric=alb_target_errors,
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High ECS CPU
        cloudwatch.Alarm(
            self,
            f"HighECSCPUAlarm-{env_suffix}",
            alarm_name=f"payment-high-ecs-cpu-{env_suffix}",
            metric=ecs_cpu,
            threshold=80,
            evaluation_periods=3,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High Database CPU
        cloudwatch.Alarm(
            self,
            f"HighDBCPUAlarm-{env_suffix}",
            alarm_name=f"payment-high-db-cpu-{env_suffix}",
            metric=db_cpu,
            threshold=80,
            evaluation_periods=3,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Lambda errors
        for i, lambda_fn in enumerate(props.lambda_functions):
            cloudwatch.Alarm(
                self,
                f"LambdaErrorAlarm-{i}-{env_suffix}",
                alarm_name=f"lambda-errors-{i}-{env_suffix}",
                metric=lambda_fn.metric_errors(),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            ).add_alarm_action(cw_actions.SnsAction(alarm_topic))
