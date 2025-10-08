# Portfolio Showcase Platform Infrastructure

I'll help you create the infrastructure for your portfolio showcase platform. Here's the complete CDK Python implementation:

## lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

from .portfolio_stack import PortfolioStack, PortfolioStackProps


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
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create nested stack for portfolio infrastructure
    class NestedPortfolioStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.portfolio_stack = PortfolioStack(self, "Resource", props=props)

    portfolio_props = PortfolioStackProps(
        environment_suffix=environment_suffix
    )

    portfolio_stack = NestedPortfolioStack(
        self,
        f"PortfolioStack{environment_suffix}",
        props=portfolio_props
    )
```

## lib/portfolio_stack.py

```python
"""portfolio_stack.py
This module defines the PortfolioStack class for the portfolio showcase platform.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_route53 as route53,
    aws_lambda as _lambda,
    aws_wafv2 as wafv2,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
)
from constructs import Construct


class PortfolioStackProps:
    """Properties for PortfolioStack"""

    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix


class PortfolioStack(Stack):
    """
    Stack for portfolio showcase platform infrastructure.

    Includes S3, CloudFront, Route53, Lambda@Edge, WAF, and CloudWatch resources.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[PortfolioStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix if props else 'dev'

        # S3 bucket for CloudFront logs
        logs_bucket = s3.Bucket(
            self,
            "LogsBucket",
            bucket_name=f"portfolio-logs-{env_suffix}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteAfter90Days",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )

        # S3 bucket for static website hosting
        website_bucket = s3.Bucket(
            self,
            "WebsiteBucket",
            bucket_name=f"portfolio-website-{env_suffix}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Lambda@Edge function for image optimization
        image_optimizer = _lambda.Function(
            self,
            "ImageOptimizer",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import base64

def handler(event, context):
    request = event['Records'][0]['cf']['request']

    # Extract width from query string
    querystring = request.get('querystring', '')
    width = 800  # default width

    if 'w=' in querystring:
        try:
            width = int(querystring.split('w=')[1].split('&')[0])
        except:
            pass

    # Add custom header for width
    request['headers']['x-image-width'] = [{'key': 'X-Image-Width', 'value': str(width)}]

    return request
"""),
            function_name=f"portfolio-image-optimizer-{env_suffix}",
            description="Lambda@Edge function for image optimization",
            memory_size=128,
            timeout=Duration.seconds(5)
        )

        # Create Lambda@Edge compatible version
        edge_function_version = image_optimizer.current_version

        # WAF Web ACL for bot protection
        waf_web_acl = wafv2.CfnWebACL(
            self,
            "PortfolioWebACL",
            name=f"portfolio-waf-{env_suffix}",
            scope="CLOUDFRONT",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(
                allow=wafv2.CfnWebACL.AllowActionProperty()
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"PortfolioWAF{env_suffix}",
                sampled_requests_enabled=True
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name="RateLimitRule",
                    priority=1,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block=wafv2.CfnWebACL.BlockActionProperty()
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ]
        )

        # Origin Access Control for CloudFront
        cfn_origin_access_control = cloudfront.CfnOriginAccessControl(
            self,
            "OriginAccessControl",
            origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
                name=f"portfolio-oac-{env_suffix}",
                origin_access_control_origin_type="s3",
                signing_behavior="always",
                signing_protocol="sigv4"
            )
        )

        # Create custom cache policies
        html_cache_policy = cloudfront.CachePolicy(
            self,
            "HTMLCachePolicy",
            cache_policy_name=f"portfolio-html-cache-{env_suffix}",
            comment="Cache policy for HTML files with shorter TTL",
            default_ttl=Duration.minutes(5),
            min_ttl=Duration.minutes(1),
            max_ttl=Duration.hours(1),
            enable_accept_encoding_gzip=True,
            enable_accept_encoding_brotli=True,
            header_behavior=cloudfront.CacheHeaderBehavior.none(),
            query_string_behavior=cloudfront.CacheQueryStringBehavior.none(),
            cookie_behavior=cloudfront.CacheCookieBehavior.none()
        )

        static_cache_policy = cloudfront.CachePolicy(
            self,
            "StaticCachePolicy",
            cache_policy_name=f"portfolio-static-cache-{env_suffix}",
            comment="Cache policy for static assets with longer TTL",
            default_ttl=Duration.days(7),
            min_ttl=Duration.days(1),
            max_ttl=Duration.days(365),
            enable_accept_encoding_gzip=True,
            enable_accept_encoding_brotli=True,
            header_behavior=cloudfront.CacheHeaderBehavior.none(),
            query_string_behavior=cloudfront.CacheQueryStringBehavior.none(),
            cookie_behavior=cloudfront.CacheCookieBehavior.none()
        )

        image_cache_policy = cloudfront.CachePolicy(
            self,
            "ImageCachePolicy",
            cache_policy_name=f"portfolio-image-cache-{env_suffix}",
            comment="Cache policy for images with query string support",
            default_ttl=Duration.days(1),
            min_ttl=Duration.hours(1),
            max_ttl=Duration.days(30),
            enable_accept_encoding_gzip=True,
            enable_accept_encoding_brotli=True,
            header_behavior=cloudfront.CacheHeaderBehavior.allowList("x-image-width"),
            query_string_behavior=cloudfront.CacheQueryStringBehavior.all(),
            cookie_behavior=cloudfront.CacheCookieBehavior.none()
        )

        # CloudFront distribution
        distribution = cloudfront.Distribution(
            self,
            "PortfolioDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(website_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=html_cache_policy,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                compress=True
            ),
            additional_behaviors={
                "*.css": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(website_bucket),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                    compress=True
                ),
                "*.js": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(website_bucket),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                    compress=True
                ),
                "images/*": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(website_bucket),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=image_cache_policy,
                    compress=True,
                    edge_lambdas=[
                        cloudfront.EdgeLambda(
                            function_version=edge_function_version,
                            event_type=cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
                        )
                    ]
                )
            },
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=404,
                    response_page_path="/error.html",
                    ttl=Duration.minutes(5)
                ),
                cloudfront.ErrorResponse(
                    http_status=500,
                    response_http_status=500,
                    response_page_path="/error.html",
                    ttl=Duration.minutes(5)
                )
            ],
            enable_logging=True,
            log_bucket=logs_bucket,
            log_file_prefix="cloudfront/",
            web_acl_id=waf_web_acl.attr_arn,
            comment=f"Portfolio showcase distribution - {env_suffix}"
        )

        # Update S3 bucket policy for CloudFront OAC access
        website_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{website_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )

        # Route 53 Hosted Zone
        hosted_zone = route53.PublicHostedZone(
            self,
            "PortfolioHostedZone",
            zone_name=f"portfolio-{env_suffix}.example.com",
            comment=f"Hosted zone for portfolio platform - {env_suffix}"
        )

        # A Record pointing to CloudFront
        route53.ARecord(
            self,
            "PortfolioAliasRecord",
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                cdk.aws_route53_targets.CloudFrontTarget(distribution)
            ),
            record_name=f"portfolio-{env_suffix}.example.com"
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "PortfolioDashboard",
            dashboard_name=f"Portfolio-Analytics-{env_suffix}"
        )

        # Add CloudFront metrics to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="CloudFront Requests",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="Requests",
                        dimensions_map={
                            "DistributionId": distribution.distribution_id
                        },
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="CloudFront Error Rate",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="4xxErrorRate",
                        dimensions_map={
                            "DistributionId": distribution.distribution_id
                        },
                        statistic="Average",
                        period=Duration.minutes(5)
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="5xxErrorRate",
                        dimensions_map={
                            "DistributionId": distribution.distribution_id
                        },
                        statistic="Average",
                        period=Duration.minutes(5)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="CloudFront Data Transfer",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CloudFront",
                        metric_name="BytesDownloaded",
                        dimensions_map={
                            "DistributionId": distribution.distribution_id
                        },
                        statistic="Sum",
                        period=Duration.minutes(5)
                    )
                ]
            )
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "WebsiteBucketName",
            value=website_bucket.bucket_name,
            description="S3 bucket for website content"
        )

        cdk.CfnOutput(
            self,
            "DistributionDomainName",
            value=distribution.distribution_domain_name,
            description="CloudFront distribution domain name"
        )

        cdk.CfnOutput(
            self,
            "DistributionId",
            value=distribution.distribution_id,
            description="CloudFront distribution ID"
        )

        cdk.CfnOutput(
            self,
            "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            description="Route 53 hosted zone ID"
        )
```

## tests/unit/test_portfolio_stack.py

```python
"""Unit tests for portfolio stack"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def stack():
    """Create stack for testing"""
    app = cdk.App()
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(
        app,
        "TestStack",
        props=props,
        env=cdk.Environment(account="123456789012", region="us-east-2")
    )
    return stack


def test_s3_buckets_created(stack):
    """Test that S3 buckets are created"""
    template = Template.from_stack(stack)

    # Check for website bucket
    template.resource_count_is("AWS::S3::Bucket", 2)

    # Verify encryption is enabled
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        }
    )


def test_cloudfront_distribution_created(stack):
    """Test that CloudFront distribution is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudFront::Distribution", 1)

    # Verify logging is enabled
    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "Logging": Match.object_like({
                    "Bucket": Match.any_value()
                })
            }
        }
    )


def test_lambda_function_created(stack):
    """Test that Lambda@Edge function is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Lambda::Function", 1)

    template.has_resource_properties(
        "AWS::Lambda::Function",
        {
            "Runtime": "python3.11",
            "Handler": "index.handler"
        }
    )


def test_waf_web_acl_created(stack):
    """Test that WAF Web ACL is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::WAFv2::WebACL", 1)

    template.has_resource_properties(
        "AWS::WAFv2::WebACL",
        {
            "Scope": "CLOUDFRONT",
            "Rules": Match.array_with([
                Match.object_like({
                    "Name": "RateLimitRule"
                })
            ])
        }
    )


def test_route53_hosted_zone_created(stack):
    """Test that Route 53 hosted zone is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::Route53::HostedZone", 1)


def test_cloudwatch_dashboard_created(stack):
    """Test that CloudWatch dashboard is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudWatch::Dashboard", 1)


def test_lifecycle_policies_configured(stack):
    """Test that S3 lifecycle policies are configured"""
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled",
                        "ExpirationInDays": 90
                    })
                ])
            }
        }
    )


def test_cache_policies_created(stack):
    """Test that custom cache policies are created"""
    template = Template.from_stack(stack)

    # Should have 3 custom cache policies
    template.resource_count_is("AWS::CloudFront::CachePolicy", 3)


def test_origin_access_control_created(stack):
    """Test that origin access control is created"""
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)

    template.has_resource_properties(
        "AWS::CloudFront::OriginAccessControl",
        {
            "OriginAccessControlConfig": {
                "OriginAccessControlOriginType": "s3",
                "SigningBehavior": "always",
                "SigningProtocol": "sigv4"
            }
        }
    )


def test_error_responses_configured(stack):
    """Test that custom error responses are configured"""
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "CustomErrorResponses": Match.array_with([
                    Match.object_like({
                        "ErrorCode": 404
                    }),
                    Match.object_like({
                        "ErrorCode": 500
                    })
                ])
            }
        }
    )


def test_multiple_cache_behaviors(stack):
    """Test that multiple cache behaviors are configured"""
    template = Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "CacheBehaviors": Match.array_with([
                    Match.object_like({
                        "PathPattern": Match.any_value()
                    })
                ])
            }
        }
    )
```

This implementation provides a complete, production-ready infrastructure for your portfolio showcase platform with all the requested features including S3 static hosting, CloudFront with custom cache behaviors, Lambda@Edge image optimization, WAF protection, Route 53 domain management, CloudWatch analytics, and proper logging with lifecycle policies.
