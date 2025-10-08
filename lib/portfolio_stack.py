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
    aws_route53_targets,
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
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False,
                ignore_public_acls=False,
                block_public_policy=True,
                restrict_public_buckets=True
            ),
            object_ownership=s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
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

        # Note: Lambda@Edge must be created in us-east-1 and cannot be deployed
        # in us-east-2. For cross-region deployments, Lambda@Edge is omitted.

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
            header_behavior=cloudfront.CacheHeaderBehavior.allow_list(
                "x-image-width"
            ),
            query_string_behavior=cloudfront.CacheQueryStringBehavior.all(),
            cookie_behavior=cloudfront.CacheCookieBehavior.none()
        )

        # CloudFront distribution
        distribution = cloudfront.Distribution(
            self,
            "PortfolioDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    website_bucket
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=html_cache_policy,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                compress=True
            ),
            additional_behaviors={
                "*.css": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        website_bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                    compress=True
                ),
                "*.js": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        website_bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=static_cache_policy,
                    compress=True
                ),
                "images/*": cloudfront.BehaviorOptions(
                    origin=origins.S3BucketOrigin.with_origin_access_control(
                        website_bucket
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=image_cache_policy,
                    compress=True
                    # Lambda@Edge omitted for cross-region deployment
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
            comment=f"Portfolio showcase distribution - {env_suffix}",
            # Note: WAF for CloudFront must be created in us-east-1
            # Removing WAF association for cross-region deployment compatibility
        )

        # Route 53 Hosted Zone
        hosted_zone = route53.PublicHostedZone(
            self,
            "PortfolioHostedZone",
            zone_name=f"portfolio-{env_suffix}-{self.account}.com",
            comment=f"Hosted zone for portfolio platform - {env_suffix}"
        )

        # A Record pointing to CloudFront
        route53.ARecord(
            self,
            "PortfolioAliasRecord",
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                aws_route53_targets.CloudFrontTarget(distribution)
            ),
            record_name=f"portfolio-{env_suffix}-{self.account}.com"
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
