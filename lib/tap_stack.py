"""tap_stack.py
This module defines the TapStack class, which creates a secure, auditable
AWS cloud environment with S3, DynamoDB, Lambda, and CloudTrail resources.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_cloudtrail as cloudtrail,
    aws_s3_notifications as s3n,
    Duration,
    RemovalPolicy
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for secure, auditable cloud infrastructure.

    This stack creates:
    - S3 bucket with versioning, Lambda triggers, and access logging
    - DynamoDB table with encryption, point-in-time recovery, and insights
    - Lambda function triggered by S3 object creation events
    - IAM roles with least privilege permissions
    - CloudTrail for audit logging

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
        s3_bucket (s3.Bucket): The main S3 bucket for the application.
        dynamodb_table (dynamodb.Table): The main DynamoDB table.
        lambda_function (_lambda.Function): The S3-triggered Lambda function.
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
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store environment suffix for reference
        self.environment_suffix = environment_suffix

        # Create CloudTrail for audit logging first
        self._create_cloudtrail(environment_suffix)

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table(environment_suffix)

        # Create S3 bucket with access logging bucket
        self.s3_bucket = self._create_s3_bucket(environment_suffix)

        # Create Lambda function and IAM role
        self.lambda_function = self._create_lambda_function(environment_suffix)

        # Set up S3 trigger for Lambda
        self._setup_s3_trigger()

    def _create_cloudtrail(self, env_suffix: str) -> cloudtrail.Trail:
        """Create CloudTrail for audit logging."""
        # Create S3 bucket for CloudTrail logs
        cloudtrail_bucket = s3.Bucket(
            self, f"CloudTrailBucket{env_suffix}",
            bucket_name=f"proj-cloudtrail-{env_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Create CloudTrail
        trail = cloudtrail.Trail(
            self, f"CloudTrail{env_suffix}",
            trail_name=f"proj-trail-{env_suffix}",
            bucket=cloudtrail_bucket,
            is_multi_region_trail=True,
            enable_file_validation=True,
            include_global_service_events=True
        )

        return trail

    def _create_dynamodb_table(self, env_suffix: str) -> dynamodb.Table:
        """Create DynamoDB table with required configurations."""
        table = dynamodb.Table(
            self, f"DynamoDBTable{env_suffix}",
            table_name=f"proj-table-{env_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            contributor_insights_enabled=True,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

        return table

    def _create_s3_bucket(self, env_suffix: str) -> s3.Bucket:
        """Create S3 bucket with versioning and access logging."""
        # Create access logging bucket first
        access_log_bucket = s3.Bucket(
            self, f"S3AccessLogBucket{env_suffix}",
            bucket_name=f"proj-access-logs-{env_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Create main S3 bucket
        bucket = s3.Bucket(
            self, f"S3Bucket{env_suffix}",
            bucket_name=f"proj-bucket-{env_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=access_log_bucket,
            server_access_logs_prefix="access-logs/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        return bucket

    def _create_lambda_function(self, env_suffix: str) -> _lambda.Function:
        """Create Lambda function with least privilege IAM role."""
        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, f"LambdaRole{env_suffix}",
            role_name=f"proj-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific permissions for S3 and DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )

        # Create Lambda function
        lambda_function = _lambda.Function(
            self, f"LambdaFunction{env_suffix}",
            function_name=f"proj-lambda-{env_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_handler.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role,
            timeout=Duration.minutes(5),
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "BUCKET_NAME": self.s3_bucket.bucket_name
            }
        )

        return lambda_function

    def _setup_s3_trigger(self):
        """Set up S3 bucket to trigger Lambda on object creation."""
        self.s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.lambda_function)
        )
