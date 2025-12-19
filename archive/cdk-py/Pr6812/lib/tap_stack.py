"""tap_stack.py
Payment Processing API Infrastructure Stack for AWS CDK.
This module defines the TapStack class which deploys a resilient payment
processing API with disaster recovery capabilities.
"""

from typing import Optional
from constructs import Construct
from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
)


class TapStackProps:
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): A suffix to identify the
        deployment environment (e.g., 'dev', 'prod').

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Payment Processing API Infrastructure Stack.

    This stack deploys a complete payment processing API infrastructure with:
    - API Gateway REST API with throttling
    - Lambda functions for validation, processing, and health monitoring
    - DynamoDB table with point-in-time recovery
    - SQS queues with dead letter queues
    - CloudWatch alarms, logs, and dashboard
    - SNS notifications for critical events

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the stack.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Tag all resources with Environment
        Tags.of(self).add("Environment", environment_suffix)

        # SNS Topic for Alarms
        alarm_topic = sns.Topic(
            self,
            "AlarmTopic",
            topic_name=f"payment-alarms-{environment_suffix}",
            display_name="Payment Processing Alarms",
        )

        # DynamoDB Table for transaction storage
        transactions_table = dynamodb.Table(
            self,
            "TransactionsTable",
            table_name=f"transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transaction_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # DynamoDB CloudWatch Alarm for throttling
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            "DynamoDBThrottleAlarm",
            alarm_name=f"dynamodb-throttle-{environment_suffix}",
            metric=transactions_table.metric_user_errors(
                statistic="Sum", period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="DynamoDB throttling detected",
        )
        dynamodb_throttle_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Dead Letter Queue for failed transactions
        failed_transactions_dlq = sqs.Queue(
            self,
            "FailedTransactionsDLQ",
            queue_name=f"failed-transactions-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # SQS Queue for async processing
        failed_transactions_queue = sqs.Queue(
            self,
            "FailedTransactionsQueue",
            queue_name=f"failed-transactions-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3, queue=failed_transactions_dlq
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Lambda: Payment Validation
        validation_function = lambda_.Function(
            self,
            "ValidationFunction",
            function_name=f"payment-validation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TRANSACTIONS_TABLE": transactions_table.table_name,
                "FAILED_QUEUE_URL": failed_transactions_queue.queue_url,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Lambda: Payment Processing
        processing_function = lambda_.Function(
            self,
            "ProcessingFunction",
            function_name=f"payment-processing-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="processing.handler",
            code=lambda_.Code.from_asset("lib/lambda/processing"),
            timeout=Duration.seconds(60),
            memory_size=512,
            environment={
                "TRANSACTIONS_TABLE": transactions_table.table_name,
                "FAILED_QUEUE_URL": failed_transactions_queue.queue_url,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Lambda: Health Monitor
        health_monitor_function = lambda_.Function(
            self,
            "HealthMonitorFunction",
            function_name=f"health-monitor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="health_monitor.handler",
            code=lambda_.Code.from_asset("lib/lambda/health_monitor"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "ALARM_TOPIC_ARN": alarm_topic.topic_arn,
                "API_NAME": f"payment-api-{environment_suffix}",
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Grant DynamoDB permissions
        transactions_table.grant_read_write_data(validation_function)
        transactions_table.grant_read_write_data(processing_function)
        transactions_table.grant_read_data(health_monitor_function)

        # Grant SQS permissions
        failed_transactions_queue.grant_send_messages(validation_function)
        failed_transactions_queue.grant_send_messages(processing_function)

        # Grant SNS permissions
        alarm_topic.grant_publish(health_monitor_function)

        # Grant CloudWatch permissions to health monitor
        health_monitor_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:DescribeAlarms",
                    "cloudwatch:PutMetricData",
                ],
                resources=["*"],
            )
        )

        health_monitor_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW, actions=["apigateway:GET"], resources=["*"]
            )
        )

        # API Gateway REST API
        api = apigateway.RestApi(
            self,
            "PaymentAPI",
            rest_api_name=f"payment-api-{environment_suffix}",
            description="Payment Processing API with disaster recovery",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            cloud_watch_role=True,
        )

        # API Gateway Resources and Methods
        validate_resource = api.root.add_resource("validate")
        validate_integration = apigateway.LambdaIntegration(validation_function)
        validate_resource.add_method("POST", validate_integration)

        process_resource = api.root.add_resource("process")
        process_integration = apigateway.LambdaIntegration(processing_function)
        process_resource.add_method("POST", process_integration)

        health_resource = api.root.add_resource("health")
        health_integration = apigateway.LambdaIntegration(health_monitor_function)
        health_resource.add_method("GET", health_integration)

        # CloudWatch Alarms for API Gateway
        api_latency_alarm = cloudwatch.Alarm(
            self,
            "APILatencyAlarm",
            alarm_name=f"api-latency-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="Latency",
                dimensions_map={
                    "ApiName": f"payment-api-{environment_suffix}",
                    "Stage": "prod",
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=1000,
            evaluation_periods=2,
            alarm_description="API Gateway latency is high",
        )
        api_latency_alarm.add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))

        # CloudWatch Alarms for Lambda Functions
        validation_error_alarm = cloudwatch.Alarm(
            self,
            "ValidationErrorAlarm",
            alarm_name=f"validation-errors-{environment_suffix}",
            metric=validation_function.metric_errors(
                statistic="Sum", period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="Validation function errors detected",
        )
        validation_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        processing_error_alarm = cloudwatch.Alarm(
            self,
            "ProcessingErrorAlarm",
            alarm_name=f"processing-errors-{environment_suffix}",
            metric=processing_function.metric_errors(
                statistic="Sum", period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            alarm_description="Processing function errors detected",
        )
        processing_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "PaymentDashboard",
            dashboard_name=f"payment-dashboard-{environment_suffix}",
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Latency",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name="Latency",
                        dimensions_map={
                            "ApiName": f"payment-api-{environment_suffix}",
                            "Stage": "prod",
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
                width=12,
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Errors",
                left=[
                    validation_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Validation Errors",
                    ),
                    processing_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Processing Errors",
                    ),
                ],
                width=12,
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    transactions_table.metric_consumed_read_capacity_units(
                        statistic="Sum", period=Duration.minutes(5)
                    ),
                    transactions_table.metric_consumed_write_capacity_units(
                        statistic="Sum", period=Duration.minutes(5)
                    ),
                ],
                width=12,
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SQS Queue Metrics",
                left=[
                    failed_transactions_queue.metric_approximate_number_of_messages_visible(
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Messages in Queue",
                    ),
                    failed_transactions_dlq.metric_approximate_number_of_messages_visible(
                        statistic="Average",
                        period=Duration.minutes(5),
                        label="Messages in DLQ",
                    ),
                ],
                width=12,
            )
        )

        # Outputs
        CfnOutput(
            self, "APIEndpoint", value=api.url, description="Payment API Endpoint"
        )

        CfnOutput(
            self,
            "TransactionsTableName",
            value=transactions_table.table_name,
            description="DynamoDB Transactions Table",
        )

        CfnOutput(
            self,
            "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS Topic for Alarms",
        )

        CfnOutput(
            self,
            "DashboardName",
            value=dashboard.dashboard_name,
            description="CloudWatch Dashboard",
        )
