"""Monitoring stack with CloudWatch Log Groups, Dashboard, and Custom Metrics"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_logs as logs,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
)
from constructs import Construct


class MonitoringStackProps(cdk.StackProps):
    """Properties for MonitoringStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class MonitoringStack(Construct):
    """Stack for monitoring resources"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[MonitoringStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix if props else 'dev'

        # Create KMS key for log encryption
        self.kms_key = kms.Key(
            self,
            f"LogsKmsKey-{env_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Add key policy for CloudWatch Logs
        region = cdk.Stack.of(self).region
        account = cdk.Stack.of(self).account
        logs_arn = f"arn:aws:logs:{region}:{account}:*"
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
                principals=[iam.ServicePrincipal(f"logs.{region}.amazonaws.com")],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": logs_arn
                    }
                }
            )
        )

        # Create CloudWatch Log Groups with 90-day retention
        self.log_groups = {}

        # Lambda log group
        self.log_groups['lambda'] = logs.LogGroup(
            self,
            f"LambdaLogGroup-{env_suffix}",
            log_group_name=f"/aws/lambda/payment-processing-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # API Gateway log group
        self.log_groups['apigateway'] = logs.LogGroup(
            self,
            f"ApiGatewayLogGroup-{env_suffix}",
            log_group_name=f"/aws/apigateway/payment-api-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # DynamoDB log group
        self.log_groups['dynamodb'] = logs.LogGroup(
            self,
            f"DynamoDBLogGroup-{env_suffix}",
            log_group_name=f"/aws/dynamodb/transactions-{env_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentsDashboard-{env_suffix}",
            dashboard_name=f"payments-observability-{env_suffix}"
        )

        # Lambda metrics
        lambda_invocations = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Invocations",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        lambda_errors = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Errors",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        lambda_duration = cloudwatch.Metric(
            namespace="AWS/Lambda",
            metric_name="Duration",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # API Gateway metrics
        api_latency = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="Latency",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        api_4xx = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="4XXError",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        api_5xx = cloudwatch.Metric(
            namespace="AWS/ApiGateway",
            metric_name="5XXError",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # DynamoDB metrics
        dynamodb_read_capacity = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedReadCapacityUnits",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        dynamodb_write_capacity = cloudwatch.Metric(
            namespace="AWS/DynamoDB",
            metric_name="ConsumedWriteCapacityUnits",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # SQS metrics
        sqs_queue_depth = cloudwatch.Metric(
            namespace="AWS/SQS",
            metric_name="ApproximateNumberOfMessagesVisible",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        # Custom business metrics
        payment_success_rate = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="PaymentSuccessRate",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        avg_transaction_value = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="AverageTransactionValue",
            statistic="Average",
            period=cdk.Duration.minutes(5)
        )

        fraud_detections = cloudwatch.Metric(
            namespace="PaymentProcessing",
            metric_name="FraudDetectionTriggers",
            statistic="Sum",
            period=cdk.Duration.minutes(5)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations & Errors",
                left=[lambda_invocations, lambda_errors],
                right=[lambda_duration],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Latency & Errors",
                left=[api_latency],
                right=[api_4xx, api_5xx],
                width=12,
                height=6
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Capacity Consumption",
                left=[dynamodb_read_capacity, dynamodb_write_capacity],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="SQS Queue Depth",
                left=[sqs_queue_depth],
                width=12,
                height=6
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Payment Success Rate",
                left=[payment_success_rate],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Average Transaction Value",
                left=[avg_transaction_value],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Fraud Detection Triggers",
                left=[fraud_detections],
                width=8,
                height=6
            )
        )

        # Create CloudWatch Logs Insights query definitions
        logs.CfnQueryDefinition(
            self,
            f"ErrorQuery-{env_suffix}",
            name=f"payment-errors-{env_suffix}",
            query_string="""
                fields @timestamp, @message, @logStream
                | filter @message like /ERROR/ or @message like /Exception/
                | sort @timestamp desc
                | limit 100
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )

        logs.CfnQueryDefinition(
            self,
            f"LatencyQuery-{env_suffix}",
            name=f"high-latency-requests-{env_suffix}",
            query_string="""
                fields @timestamp, @message, @duration
                | filter @duration > 1000
                | sort @duration desc
                | limit 50
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )

        logs.CfnQueryDefinition(
            self,
            f"FailedTransactionsQuery-{env_suffix}",
            name=f"failed-payment-transactions-{env_suffix}",
            query_string="""
                fields @timestamp, @message
                | filter @message like /payment.*failed/ or @message like /transaction.*error/
                | parse @message "transactionId=*," as txId
                | stats count() by txId
                | sort count desc
                | limit 20
            """,
            log_group_names=[lg.log_group_name for lg in self.log_groups.values()]
        )
