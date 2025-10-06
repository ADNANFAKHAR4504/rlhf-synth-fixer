"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_logs as logs,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct
from typing import Optional
import aws_cdk as cdk


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
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the 
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ==================== S3 Bucket for Logs ====================
        log_bucket = s3.Bucket(
            self, "ApplicationLogsBucket",
            bucket_name=f"user-mgmt-logs-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30),
                )
            ],
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ==================== DynamoDB Table ====================
        users_table = dynamodb.Table(
            self, "UsersTable",
            table_name=f"UserManagementTable-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdDate",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ==================== SQS Dead Letter Queue ====================
        dlq = sqs.Queue(
            self, "UserManagementDLQ",
            queue_name=f"user-management-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS_MANAGED,
        )

        # ==================== IAM Role for Lambda ====================
        lambda_role = iam.Role(
            self, "UserManagementLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for User Management Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )
        users_table.grant_read_write_data(lambda_role)
        log_bucket.grant_write(lambda_role)
        dlq.grant_send_messages(lambda_role)

        # ==================== Lambda Functions ====================
        create_user_lambda = lambda_.Function(
            self, "CreateUserFunction",
            runtime=lambda_.Runtime.NODEJS_20_X,
            handler="index.createUser",
            code=lambda_.Code.from_asset("lambda/create_user"),
            timeout=Duration.seconds(30),
            memory_size=512,
            role=lambda_role,
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": users_table.table_name,
                "LOG_BUCKET": log_bucket.bucket_name,
            },
            dead_letter_queue=dlq,
        )

        # ==================== API Gateway ====================
        api = apigateway.RestApi(
            self, "UserManagementApi",
            rest_api_name="UserManagementAPI",
            description="API for user management operations",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                tracing_enabled=True,
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(create_user_lambda),
        )

        # ==================== CloudFront Distribution ====================
        cf_distribution = cloudfront.Distribution(
            self, "UserManagementDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.RestApiOrigin(api),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
        )

        # ==================== CloudWatch Alarms ====================
        cloudwatch.Alarm(
            self, "CreateUserDurationAlarm",
            metric=create_user_lambda.metric_duration(statistic="Average"),
            threshold=25000,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        # ==================== Outputs ====================
        CfnOutput(self, "ApiUrl", value=api.url, description="API Gateway URL")
        CfnOutput(self, "CloudFrontUrl", value=f"https://{cf_distribution.domain_name}", description="CloudFront URL")
        CfnOutput(self, "DynamoDBTableName", value=users_table.table_name, description="DynamoDB Table Name")
        CfnOutput(self, "LogBucketName", value=log_bucket.bucket_name, description="S3 Log Bucket Name")
        CfnOutput(self, "DLQUrl", value=dlq.queue_url, description="Dead Letter Queue URL")
