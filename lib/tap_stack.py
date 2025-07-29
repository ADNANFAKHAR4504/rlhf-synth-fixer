"""tap_stack.py
This module defines the TapStack class, which implements a serverless web backend 
architecture using AWS CDK with Python.

The stack includes:
- Lambda Function (Python 3.8)
- API Gateway HTTP API with CORS
- S3 Bucket with static website hosting via CloudFront
- CloudFront distribution with Origin Access Control
- DynamoDB Table with GSI
- CloudWatch monitoring and alarms
- KMS encryption for S3 and DynamoDB
"""
from typing import Optional

from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_kms as kms
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from constructs import Construct


class TapStackProps(StackProps):
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


class TapStack(Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack creates all AWS resources directly instead of using nested stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    # Store in a class variable if needed elsewhere in the stack
    self.environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create KMS keys for encryption
    s3_kms_key = kms.Key(
        self,
        "S3EncryptionKey",
        description="KMS key for S3 bucket encryption",
        enable_key_rotation=True,
        removal_policy=RemovalPolicy.DESTROY
    )

    dynamodb_kms_key = kms.Key(
        self,
        "DynamoDBEncryptionKey",
        description="KMS key for DynamoDB table encryption",
        enable_key_rotation=True,
        removal_policy=RemovalPolicy.DESTROY
    )

    # DynamoDB Table for visit logs with KMS encryption and GSI
    table = dynamodb.Table(
        self,
        "VisitsTable",
        partition_key=dynamodb.Attribute(
            name="id",
            type=dynamodb.AttributeType.STRING
        ),
        encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryption_key=dynamodb_kms_key,
        removal_policy=RemovalPolicy.DESTROY,
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
    )

    # Add GSI for timestamp-based queries
    table.add_global_secondary_index(
        index_name="timestamp-index",
        partition_key=dynamodb.Attribute(
            name="timestamp",
            type=dynamodb.AttributeType.STRING
        ),
        projection_type=dynamodb.ProjectionType.ALL
    )

    # Tag table with environment: production
    Tags.of(table).add("environment", "production")

    # Lambda Function (Python 3.8) for backend logic
    lambda_function = _lambda.Function(
        self,
        "BackendHandler",
        runtime=_lambda.Runtime.PYTHON_3_8,
        handler="backend_handler.handler",
        code=_lambda.Code.from_asset(
            "lib/lambda",
            exclude=["__pycache__", "*.pyc"]
        ),
        environment={
            "TABLE_NAME": table.table_name,
            "LOG_LEVEL": "INFO"
        },
        log_retention=logs.RetentionDays.ONE_MONTH,
        timeout=Duration.seconds(30),
        memory_size=128
    )

    # Grant least-privilege permissions to Lambda
    table.grant_write_data(lambda_function)

    # Note: CloudWatch Logs permissions are automatically granted by CDK
    # when log_retention is set on the Lambda function

    # API Gateway HTTP API with CORS enabled for all origins
    http_api = apigw.HttpApi(
        self,
        "HttpApi",
        cors_preflight=apigw.CorsPreflightOptions(
            allow_headers=["Content-Type", "Authorization"],
            allow_methods=[
                apigw.CorsHttpMethod.GET,
                apigw.CorsHttpMethod.POST,
                apigw.CorsHttpMethod.OPTIONS
            ],
            allow_origins=["*"],  # Enable CORS for all origins as required
            max_age=Duration.hours(1)
        )
    )

    # Add Lambda integration to API Gateway
    http_api.add_routes(
        path="/{proxy+}",
        methods=[apigw.HttpMethod.ANY],
        integration=integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            lambda_function
        )
    )

    # S3 Bucket for static content hosting with versioning and KMS encryption
    # Private bucket - accessed via CloudFront distribution only (no direct S3 website hosting)
    bucket = s3.Bucket(
        self,
        "FrontendBucket",
        versioned=True,
        encryption=s3.BucketEncryption.KMS,
        encryption_key=s3_kms_key,
        # Remove website hosting properties - not compatible with private bucket + OAI
        public_read_access=False,  # Private bucket - accessed via CloudFront
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Tag bucket with environment: production
    Tags.of(bucket).add("environment", "production")

    # Create CloudFront Origin Access Identity for secure S3 access
    origin_access_identity = cloudfront.OriginAccessIdentity(
        self,
        "WebsiteOAI",
        comment=f"OAI for static website {self.environment_suffix}"
    )

    # Grant CloudFront access to S3 bucket
    bucket.grant_read(origin_access_identity)

    # Create CloudFront distribution for secure static content delivery
    distribution = cloudfront.CloudFrontWebDistribution(
        self,
        "WebsiteDistribution",
        origin_configs=[
            cloudfront.SourceConfiguration(
                s3_origin_source=cloudfront.S3OriginConfig(
                    s3_bucket_source=bucket,
                    origin_access_identity=origin_access_identity
                ),
                behaviors=[
                    cloudfront.Behavior(
                        is_default_behavior=True,
                        compress=True,
                        allowed_methods=cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                        cached_methods=cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                        viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        min_ttl=Duration.seconds(0),
                        default_ttl=Duration.seconds(86400),
                        max_ttl=Duration.seconds(31536000)
                    )
                ]
            )
        ],
        default_root_object="index.html",
        error_configurations=[
            cloudfront.CfnDistribution.CustomErrorResponseProperty(
                error_code=404,
                response_code=200,
                response_page_path="/error.html",
                error_caching_min_ttl=300
            ),
            cloudfront.CfnDistribution.CustomErrorResponseProperty(
                error_code=403,
                response_code=200,
                response_page_path="/error.html",
                error_caching_min_ttl=300
            )
        ],
        price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        enabled=True
    )

    # Basic CloudWatch Alarms for Lambda function failures and throttling
    cloudwatch.Alarm(
        self,
        "LambdaErrorAlarm",
        metric=lambda_function.metric_errors(),
        threshold=1,
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarm_description="Alarm for Lambda function errors"
    )

    cloudwatch.Alarm(
        self,
        "LambdaThrottleAlarm",
        metric=lambda_function.metric_throttles(),
        threshold=1,
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarm_description="Alarm for Lambda function throttling"
    )

    # High latency alarm for API Gateway
    cloudwatch.Alarm(
        self,
        "ApiLatencyAlarm",
        metric=cloudwatch.Metric(
            namespace="AWS/ApiGatewayV2",
            metric_name="IntegrationLatency",
            dimensions_map={"ApiId": http_api.api_id}
        ),
        threshold=5000,  # 5 seconds
        evaluation_periods=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarm_description="Alarm for high API Gateway latency"
    )

    # CloudFormation Outputs
    CfnOutput(
        self,
        "ApiEndpoint",
        value=http_api.url or "API URL not available",
        description="API Gateway endpoint URL"
    )

    CfnOutput(
        self,
        "WebsiteURL",
        value=f"https://{distribution.distribution_domain_name}",
        description="URL of the static website served via CloudFront distribution from private S3 bucket"
    )

    CfnOutput(
        self,
        "CloudFrontDistributionId",
        value=distribution.distribution_id,
        description="CloudFront Distribution ID for static content delivery"
    )

    CfnOutput(
        self,
        "CloudFrontDistributionDomain",
        value=distribution.distribution_domain_name,
        description="CloudFront Distribution Domain Name for static content access"
    )

    CfnOutput(
        self,
        "FrontendBucketName",
        value=bucket.bucket_name,
        description="Name of the private S3 bucket for static content storage (accessed via CloudFront)"
    )

    CfnOutput(
        self,
        "VisitsTableName",
        value=table.table_name,
        description="Name of the DynamoDB table for visit logs"
    )

    CfnOutput(
        self,
        "LambdaFunctionName",
        value=lambda_function.function_name,
        description="Name of the Lambda function"
    )

    CfnOutput(
        self,
        "StackName",
        value=self.stack_name,
        description="Name of the CloudFormation stack"
    )
