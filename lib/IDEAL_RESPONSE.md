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

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, SecretValue, Stack
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
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

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id,**kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
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
        point_in_time_recovery=True,  # Enable point-in-time recovery
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
            "POWERTOOLS_METRICS_NAMESPACE": "VisitMetrics",
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
        memory_size=256  # Increased for better cold start performance
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

    # Add WAF protection
    waf_acl = wafv2.CfnWebACL(
        self,
        "ApiWafAcl",
        default_action={"allow": {}},
        scope="REGIONAL",
        visibility_config={
            "cloudWatchMetricsEnabled": True,
            "metricName": "WafMetrics",
            "sampledRequestsEnabled": True
        },
        rules=[
            {
                "name": "RateLimit",
                "priority": 1,
                "action": {"block": {}},
                "statement": {
                    "rateBasedStatement": {
                        "limit": 2000,
                        "aggregateKeyType": "IP"
                    }
                },
                "visibilityConfig": {
                    "cloudWatchMetricsEnabled": True,
                    "metricName": "RateLimitMetric",
                    "sampledRequestsEnabled": True
                }
            }
        ]
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

    # Associate WAF with API Gateway
    wafv2.CfnWebACLAssociation(
        self,
        "WafApiAssociation",
        resource_arn=f"arn:aws:apigateway:{Stack.of(self).region}:{Stack.of(self).account}:/apis/{http_api.api_id}/stages/$default",
        web_acl_arn=waf_acl.attr_arn
    )

    # Output the API URL
    cdk.CfnOutput(
        self,
        "ApiEndpoint",
        value=http_api.url if http_api.url else "API URL not available",
        description="API Gateway endpoint URL"
    )

    # Add Lambda permissions for API Gateway using CDK's built-in method
    lambda_function.grant_invoke(
        iam.ServicePrincipal("apigateway.amazonaws.com"))

    # S3 Bucket for frontend with enhanced security and static website hosting
    bucket = s3.Bucket(
        self,
        "FrontendBucket",
        versioned=True,
        encryption=s3.BucketEncryption.KMS,
        encryption_key=s3_kms_key,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        enforce_ssl=True,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
        website_index_document="index.html",
        website_error_document="error.html"
    )

    # Create bucket policy to allow public read access for website
    bucket_policy = iam.PolicyStatement(
        actions=["s3:GetObject"],
        resources=[bucket.arn_for_objects("*")],
        principals=[iam.AnyPrincipal()]
    )

    # Apply the policy to the bucket
    bucket.add_to_resource_policy(bucket_policy)

    # CloudFront Distribution for S3
    distribution = cloudfront.Distribution(
        self,
        "FrontendDistribution",
        default_behavior=cloudfront.BehaviorOptions(
            origin=origins.S3Origin(bucket),
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

    # Enhanced CloudWatch Monitoring
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
    
    # Additional CloudFormation Outputs for integration testing
    cdk.CfnOutput(
        self,
        "StackName",
        value=self.stack_name,
        description="Name of the CloudFormation stack"
    )
    
    cdk.CfnOutput(
        self,
        "FrontendBucketName",
        value=bucket.bucket_name,
        description="Name of the S3 bucket for frontend hosting"
    )
    
    cdk.CfnOutput(
        self,
        "VisitsTableName",
        value=table.table_name,
        description="Name of the DynamoDB table for visit logs"
    )
    
    cdk.CfnOutput(
        self,
        "ApiSecretArn",
        value=api_secret.secret_arn,
        description="ARN of the Secret used by the API"
    )
    
    cdk.CfnOutput(
        self,
        "CloudFrontDomainName",
        value=distribution.domain_name,
        description="Domain name of the CloudFront distribution"
    )
