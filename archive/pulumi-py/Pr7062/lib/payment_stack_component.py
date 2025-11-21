"""
Payment Stack Component - Main orchestration component.
Combines all infrastructure components for payment processing.
"""

from typing import Optional, Dict
import pulumi
from pulumi import ResourceOptions, Output
from lib.environment_config import get_environment_config
from lib.vpc_component import VpcComponent, VpcComponentArgs
from lib.dynamodb_component import DynamoDBComponent, DynamoDBComponentArgs
from lib.s3_component import S3Component, S3ComponentArgs
from lib.iam_component import IAMComponent, IAMComponentArgs
from lib.lambda_component import LambdaComponent, LambdaComponentArgs
from lib.monitoring_component import MonitoringComponent, MonitoringComponentArgs


class PaymentStackArgs:
    """Arguments for Payment Stack Component."""

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class PaymentStackComponent(pulumi.ComponentResource):
    """
    Main payment processing stack component.
    Orchestrates all infrastructure components with environment-specific configurations.
    """

    def __init__(
        self,
        name: str,
        args: PaymentStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:stack:PaymentStackComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Get environment configuration
        self.env_config = get_environment_config(args.environment_suffix)

        # Merge environment tags with provided tags
        merged_tags = {
            **self.env_config.get_tags(),
            **args.tags
        }

        # Create VPC
        self.vpc = VpcComponent(
            f"payment-vpc-{args.environment_suffix}",
            VpcComponentArgs(
                environment_suffix=args.environment_suffix,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create DynamoDB table
        self.dynamodb = DynamoDBComponent(
            f"payment-dynamodb-{args.environment_suffix}",
            DynamoDBComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create S3 bucket
        self.s3 = S3Component(
            f"payment-s3-{args.environment_suffix}",
            S3ComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create IAM roles
        self.iam = IAMComponent(
            f"payment-iam-{args.environment_suffix}",
            IAMComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                dynamodb_table_arn=self.dynamodb.table.arn,
                s3_bucket_arn=self.s3.bucket.arn,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create Lambda function
        self.lambda_func = LambdaComponent(
            f"payment-lambda-{args.environment_suffix}",
            LambdaComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                role_arn=self.iam.lambda_role.arn,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Create CloudWatch monitoring
        self.monitoring = MonitoringComponent(
            f"payment-monitoring-{args.environment_suffix}",
            MonitoringComponentArgs(
                environment_suffix=args.environment_suffix,
                env_config=self.env_config,
                lambda_function_name=self.lambda_func.function.name,
                dynamodb_table_name=self.dynamodb.table.name,
                tags=merged_tags
            ),
            opts=child_opts
        )

        # Register outputs for manifest generation
        self.register_outputs({
            'environment': self.env_config.name,
            'account_id': self.env_config.account_id,
            'region': self.env_config.region,
            'vpc_id': self.vpc.vpc.id,
            'lambda_function_arn': self.lambda_func.function.arn,
            'lambda_function_name': self.lambda_func.function.name,
            'dynamodb_table_name': self.dynamodb.table.name,
            'dynamodb_table_arn': self.dynamodb.table.arn,
            's3_bucket_name': self.s3.bucket.id,
            's3_bucket_arn': self.s3.bucket.arn,
            'lambda_role_arn': self.iam.lambda_role.arn,
        })
