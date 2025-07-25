"""tap_stack.py
This module defines the TapStack class, which implements a serverless web backend 
architecture using AWS CDK with Python.

The stack includes:
- API Gateway HTTP API
- Lambda Function with Powertools
- DynamoDB Table with GSI
- S3 Bucket with CloudFront
- CloudWatch monitoring
"""
from typing import Optional

from aws_cdk import CfnOutput
from aws_cdk import CfnTag as cdk_CfnTag
from aws_cdk import Duration, RemovalPolicy, Stack, StackProps
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_secretsmanager as secretsmanager
from aws_cdk import aws_wafv2 as wafv2
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
        alias="alias/s3-encryption-key",
        removal_policy=RemovalPolicy.DESTROY
    )

    dynamodb_kms_key = kms.Key(
        self,
        "DynamoDBEncryptionKey",
        description="KMS key for DynamoDB table encryption",
        enable_key_rotation=True,
        alias="alias/dynamodb-encryption-key",
        removal_policy=RemovalPolicy.DESTROY
    )

    # Create a secret for sensitive environment variables
    api_secret = secretsmanager.Secret(
        self,
        "ApiSecret",
        description="Secret for API backend",
        encryption_key=kms.Key(
            self,
            "SecretEncryptionKey",
            enable_key_rotation=True,
            alias="alias/secret-encryption-key",
            removal_policy=RemovalPolicy.DESTROY
        )
    )

    # DynamoDB Table with custom KMS key
    table = dynamodb.Table(
        self,
        "VisitsTable",
        partition_key=dynamodb.Attribute(
            name="id",
            type=dynamodb.AttributeType.STRING
        ),
        encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryption_key=dynamodb_kms_key,
        point_in_time_recovery_specification={
            "point_in_time_recovery_enabled": True},
        removal_policy=RemovalPolicy.DESTROY,
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST  # Use on-demand capacity
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

    # Create Lambda Layer for Powertools
    powertools_layer = _lambda.LayerVersion(
        self,
        "PowertoolsLayer",
        code=_lambda.Code.from_asset("lib/lambda", exclude=[
            "*.py",
            "test/*",
            "__pycache__",
            "*.pyc",
        ]),
        compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
        description="AWS Lambda Powertools Layer"
    )

    # Lambda Function with Powertools and dependencies
    lambda_function = _lambda.Function(
        self,
        "BackendHandler",
        runtime=_lambda.Runtime.PYTHON_3_12,
        handler="backend_handler.handler",
        code=_lambda.Code.from_asset(
            "lib/lambda",
            exclude=["__pycache__", "*.pyc", "requirements.txt"]
        ),
        layers=[powertools_layer],
        environment={
            "TABLE_NAME": table.table_name,
            "POWERTOOLS_SERVICE_NAME": "visit-logger",
            "LOG_LEVEL": "INFO",
            "POWERTOOLS_LOGGER_LOG_EVENT": "true",
            "POWERTOOLS_LOGGER_SAMPLE_RATE": "0.1",
            "POWERTOOLS_METRICS_NAMESPACE": "ServerlessApp",
            # Reference to the secret for sensitive data
            "API_SECRET_ARN": api_secret.secret_arn
        },
        tracing=_lambda.Tracing.ACTIVE,  # Enable X-Ray tracing
        log_retention=logs.RetentionDays.ONE_MONTH,
        timeout=Duration.seconds(30),
        memory_size=128  # Optimized from 256MB to 128MB for cost efficiency
    )

    # Grant Lambda access to read the secret
    api_secret.grant_read(lambda_function)

    # Grant least-privilege permissions to Lambda
    table.grant_write_data(lambda_function)

    # API Gateway with improved CORS and security
    http_api = apigw.HttpApi(
        self,
        "HttpApi",
        cors_preflight=apigw.CorsPreflightOptions(
            allow_headers=["Content-Type", "Authorization"],
            allow_methods=[apigw.CorsHttpMethod.GET,
                           apigw.CorsHttpMethod.POST],
            # Will be restricted by CloudFront distribution
            allow_origins=["*"],
            max_age=Duration.days(1)
        )
    )

    # Create WAF Web ACL
    waf_acl = wafv2.CfnWebACL(
        self, "ApiWafAcl",
        default_action=wafv2.CfnWebACL.DefaultActionProperty(
            allow={}
        ),
        scope="REGIONAL",
        visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
            cloud_watch_metrics_enabled=True,
            metric_name="WafMetrics",
            sampled_requests_enabled=True
        ),
        rules=[
            wafv2.CfnWebACL.RuleProperty(
                name="RateLimit",
                priority=1,
                action=wafv2.CfnWebACL.RuleActionProperty(
                    block={}
                ),
                statement=wafv2.CfnWebACL.StatementProperty(
                    rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                        aggregate_key_type="IP",
                        limit=2000
                    )
                ),
                visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                    cloud_watch_metrics_enabled=True,
                    metric_name="RateLimitMetric",
                    sampled_requests_enabled=True
                )
            )
        ],
        tags=[
            cdk_CfnTag(
                key="Environment",
                value="dev"
            ),
            cdk_CfnTag(
                key="Author",
                value="unknown"
            ),
            cdk_CfnTag(
                key="Repository",
                value="unknown"
            )
        ]
    )

    # Associate WAF with API Gateway
    wafv2.CfnWebACLAssociation(
        self, "WafApiAssociation",
        resource_arn=f"arn:aws:apigateway:{Stack.of(self).region}:{Stack.of(self).account}:"
        f"api/{http_api.api_id}/stage/$default",
        web_acl_arn=waf_acl.attr_arn
    )

    # Create Lambda integration
    integration = apigw.CfnIntegration(
        self,
        "HttpApiIntegration",
        api_id=http_api.api_id,
        integration_type="AWS_PROXY",
        integration_uri=lambda_function.function_arn,
        payload_format_version="2.0"
    )

    # Create default route
    apigw.CfnRoute(
        self,
        "DefaultRoute",
        api_id=http_api.api_id,
        route_key="ANY /{proxy+}",
        target=f"integrations/{integration.ref}"
    )

    # Add Lambda permissions for API Gateway using CDK's built-in method
    lambda_function.grant_invoke(
        iam.ServicePrincipal("apigateway.amazonaws.com")
    )

    # S3 Bucket for frontend with enhanced security and static website hosting
    bucket = s3.Bucket(
        self,
        "FrontendBucket",
        versioned=True,
        encryption=s3.BucketEncryption.KMS,
        encryption_key=s3_kms_key,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Block all public access
        enforce_ssl=True,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Create Origin Access Control for CloudFront
    oac = cloudfront.CfnOriginAccessControl(
        self,
        "CloudFrontOAC",
        origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty
        (
            name=f"{construct_id}-oac",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4"
        )
    )

    # CloudFront Distribution for S3 with Origin Access Control
    distribution = cloudfront.Distribution(
        self,
        "FrontendDistribution",
        default_behavior=cloudfront.BehaviorOptions(
            origin=origins.S3BucketOrigin(bucket),
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
        ),
        error_responses=[
            cloudfront.ErrorResponse(
                http_status=403,
                response_http_status=200,
                response_page_path="/index.html"
            ),
            cloudfront.ErrorResponse(
                http_status=404,
                response_http_status=200,
                response_page_path="/index.html"
            )
        ]
    )

    # Apply OAC to the CloudFront distribution's S3 origin using L1 construct
    cfn_distribution = distribution.node.default_child
    cfn_distribution.add_property_override(
        "DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity", ""
    )
    cfn_distribution.add_property_override(
        "DistributionConfig.Origins.0.OriginAccessControlId", oac.attr_id
    )

    # Grant CloudFront access to the S3 bucket with KMS key
    bucket.add_to_resource_policy(
        iam.PolicyStatement(
            actions=["s3:GetObject"],
            resources=[bucket.arn_for_objects("*")],
            principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
            conditions={
                "StringEquals": {
                    "AWS:SourceArn": (
                        f"arn:aws:cloudfront::{Stack.of(self).account}:"
                        f"distribution/*"
                    )
                }
            }
        )
    )

    # Grant CloudFront access to use the KMS key
    s3_kms_key.add_to_resource_policy(
        iam.PolicyStatement(
            actions=[
                "kms:Decrypt",
                "kms:GenerateDataKey*"
            ],
            resources=["*"],
            principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
            conditions={
                "StringEquals": {
                    "AWS:SourceArn": (
                        f"arn:aws:cloudfront::{Stack.of(self).account}:"
                        f"distribution/*"
                    )
                }
            }
        )
    )

    # Enhanced CloudWatch Monitoring
    # Create dashboard and save reference for future use if needed
    dashboard = cloudwatch.Dashboard(
        self,
        "ServiceDashboard",
        dashboard_name=f"{construct_id}-dashboard"
    )

    # Lambda Metrics
    errors_metric = lambda_function.metric_errors()
    throttles_metric = lambda_function.metric_throttles()
    duration_metric = lambda_function.metric_duration()
    invocations_metric = lambda_function.metric_invocations()

    # API Gateway Metrics using custom metrics
    api_metrics = {
        'Latency': cloudwatch.Metric(
            namespace='AWS/ApiGateway',
            metric_name='Latency',
            dimensions_map={'ApiId': http_api.api_id},
            period=Duration.minutes(1),
            statistic='p99'
        ),
        'Count': cloudwatch.Metric(
            namespace='AWS/ApiGateway',
            metric_name='Count',
            dimensions_map={'ApiId': http_api.api_id},
            period=Duration.minutes(1)
        ),
        '5XXError': cloudwatch.Metric(
            namespace='AWS/ApiGateway',
            metric_name='5XXError',
            dimensions_map={'ApiId': http_api.api_id},
            period=Duration.minutes(1)
        ),
        '4XXError': cloudwatch.Metric(
            namespace='AWS/ApiGateway',
            metric_name='4XXError',
            dimensions_map={'ApiId': http_api.api_id},
            period=Duration.minutes(1)
        )
    }

    # Add metrics to dashboard for visualization
    dashboard.add_widgets(
        cloudwatch.GraphWidget(
            title="Lambda Errors",
            left=[errors_metric]
        ),
        cloudwatch.GraphWidget(
            title="Lambda Throttles",
            left=[throttles_metric]
        ),
        cloudwatch.GraphWidget(
            title="Lambda Duration",
            left=[duration_metric]
        ),
        cloudwatch.GraphWidget(
            title="Lambda Invocations",
            left=[invocations_metric]
        ),
        cloudwatch.GraphWidget(
            title="API Gateway Latency",
            left=[api_metrics['Latency']]
        )
    )

    # CloudWatch Alarms with more detailed configuration
    error_alarm = cloudwatch.Alarm(
        self,
        "LambdaErrorAlarm",
        metric=errors_metric,
        threshold=5,
        evaluation_periods=3,
        datapoints_to_alarm=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
    )

    throttle_alarm = cloudwatch.Alarm(
        self,
        "LambdaThrottleAlarm",
        metric=throttles_metric,
        threshold=5,
        evaluation_periods=3,
        datapoints_to_alarm=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
    )

    latency_alarm = cloudwatch.Alarm(
        self,
        "ApiLatencyAlarm",
        metric=api_metrics['Latency'],
        threshold=1000,  # 1 second
        evaluation_periods=3,
        datapoints_to_alarm=2,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
    )

    # Register the alarms with the dashboard
    dashboard.add_widgets(
        cloudwatch.AlarmWidget(
            title="Lambda Error Alarm",
            alarm=error_alarm
        ),
        cloudwatch.AlarmWidget(
            title="Lambda Throttle Alarm",
            alarm=throttle_alarm
        ),
        cloudwatch.AlarmWidget(
            title="API Latency Alarm",
            alarm=latency_alarm
        )
    )

    # Output the API URL
    CfnOutput(
        self,
        "ApiEndpoint",
        value=http_api.url if http_api.url else "API URL not available",
        description="API Gateway endpoint URL"
    )

    # Additional CloudFormation Outputs for integration testing
    CfnOutput(
        self,
        "StackName",
        value=self.stack_name,
        description="Name of the CloudFormation stack"
    )

    CfnOutput(
        self,
        "FrontendBucketName",
        value=bucket.bucket_name,
        description="Name of the S3 bucket for frontend hosting"
    )

    CfnOutput(
        self,
        "VisitsTableName",
        value=table.table_name,
        description="Name of the DynamoDB table for visit logs"
    )

    CfnOutput(
        self,
        "ApiSecretArn",
        value=api_secret.secret_arn,
        description="ARN of the Secret used by the API"
    )

    CfnOutput(
        self,
        "CloudFrontDomainName",
        value=distribution.domain_name,
        description="Domain name of the CloudFront distribution"
    )

    CfnOutput(
        self,
        "LambdaFunctionName",
        value=lambda_function.function_name,
        description="Name of the Lambda function"
    )
