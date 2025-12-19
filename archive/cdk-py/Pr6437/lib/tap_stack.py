"""tap_stack.py
Main orchestration stack for Single-Region Payment Processing Infrastructure.

All infrastructure stacks are created at the app level in tap.py.
This stack aggregates outputs from all component stacks for easier access.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod')
        **kwargs: Additional keyword arguments passed to cdk.StackProps
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main coordination stack for single-region payment processing deployment.

    This stack aggregates outputs from all component stacks deployed in us-east-1.
    All actual infrastructure stacks are created at the app level in tap.py.

    Component stacks include:
    - VPC Stack (networking infrastructure)
    - Database Stack (Aurora PostgreSQL, DynamoDB)
    - Lambda Stack (payment validation, transaction processing, notifications)
    - API Gateway Stack (REST API)
    - Storage Stack (S3 bucket)
    - Monitoring Stack (CloudWatch alarms, SNS topics)
    - Parameter Store Stack (configuration management)

    Args:
        scope (Construct): The parent construct (app)
        construct_id (str): Stack identifier
        props (Optional[TapStackProps]): Stack properties
        **kwargs: Additional CDK Stack arguments
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Export environment suffix for reference
        cdk.CfnOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix for resource identification",
            export_name=f"environment-suffix-{environment_suffix}"
        )

        # Import and re-export all outputs from other stacks
        # This aggregates all outputs into TapStack for easier access

        # VPC Outputs
        cdk.CfnOutput(
            self, "VpcId",
            value=cdk.Fn.import_value(f"vpc-id-{environment_suffix}"),
            description="VPC ID"
        )

        # Database Outputs
        cdk.CfnOutput(
            self, "DBEndpoint",
            value=cdk.Fn.import_value(f"db-endpoint-{environment_suffix}"),
            description="RDS Aurora cluster endpoint"
        )
        cdk.CfnOutput(
            self, "DynamoDBTableName",
            value=cdk.Fn.import_value(f"dynamodb-table-name-{environment_suffix}"),
            description="DynamoDB table name"
        )

        # Lambda Outputs
        cdk.CfnOutput(
            self, "PaymentValidationFn",
            value=cdk.Fn.import_value(f"payment-validation-fn-{environment_suffix}"),
            description="Payment validation Lambda function name"
        )
        cdk.CfnOutput(
            self, "TransactionProcessingFn",
            value=cdk.Fn.import_value(f"transaction-processing-fn-{environment_suffix}"),
            description="Transaction processing Lambda function name"
        )
        cdk.CfnOutput(
            self, "NotificationFn",
            value=cdk.Fn.import_value(f"notification-fn-{environment_suffix}"),
            description="Notification Lambda function name"
        )

        # API Gateway Outputs
        cdk.CfnOutput(
            self, "APIEndpoint",
            value=cdk.Fn.import_value(f"api-url-{environment_suffix}"),
            description="API Gateway endpoint URL"
        )
        cdk.CfnOutput(
            self, "APIId",
            value=cdk.Fn.import_value(f"api-id-{environment_suffix}"),
            description="API Gateway ID"
        )

        # Storage Outputs
        cdk.CfnOutput(
            self, "BucketName",
            value=cdk.Fn.import_value(f"bucket-name-{environment_suffix}"),
            description="S3 bucket name"
        )
        cdk.CfnOutput(
            self, "BucketArn",
            value=cdk.Fn.import_value(f"bucket-arn-{environment_suffix}"),
            description="S3 bucket ARN"
        )

        # Monitoring Outputs
        cdk.CfnOutput(
            self, "AlarmTopicArn",
            value=cdk.Fn.import_value(f"alarm-topic-arn-{environment_suffix}"),
            description="SNS topic ARN for alarms"
        )

        # All infrastructure stacks are created in tap.py at app level:
        # - VpcStack (us-east-1 networking)
        # - DatabaseStack (Aurora PostgreSQL, DynamoDB)
        # - LambdaStack (payment functions)
        # - ApiStack (REST API Gateway)
        # - StorageStack (S3 bucket)
        # - MonitoringStack (CloudWatch, SNS)
        # - ParameterStoreStack (SSM parameters)
