"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

from .cloudfront_stack import CloudFrontStack
from .s3_stack import S3Stack
from .dynamodb_stack import DynamoDBStack
from .lambda_edge_stack import LambdaEdgeStack
from .waf_stack import WAFStack
from .route53_stack import Route53Stack
from .monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # S3 bucket for origin content
        s3_stack = S3Stack(
            f"s3-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB table for edge configuration
        dynamodb_stack = DynamoDBStack(
            f"dynamodb-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda@Edge functions
        lambda_edge_stack = LambdaEdgeStack(
            f"lambda-edge-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            dynamodb_table_name=dynamodb_stack.table_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # WAF Web ACL
        waf_stack = WAFStack(
            f"waf-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudFront distribution
        cloudfront_stack = CloudFrontStack(
            f"cloudfront-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            origin_bucket=s3_stack.bucket,
            viewer_request_lambda_arn=lambda_edge_stack.viewer_request_function_qualified_arn,
            origin_response_lambda_arn=lambda_edge_stack.origin_response_function_qualified_arn,
            web_acl_id=waf_stack.web_acl_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Route 53 DNS
        route53_stack = Route53Stack(
            f"route53-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            cloudfront_domain_name=cloudfront_stack.distribution_domain_name,
            cloudfront_hosted_zone_id=cloudfront_stack.distribution_hosted_zone_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch monitoring
        monitoring_stack = MonitoringStack(
            f"monitoring-stack-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            distribution_id=cloudfront_stack.distribution_id,
            lambda_function_names=[
                lambda_edge_stack.viewer_request_function_name,
                lambda_edge_stack.origin_response_function_name
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        pulumi.export('bucket_name', s3_stack.bucket_name)
        pulumi.export('cloudfront_domain_name', cloudfront_stack.distribution_domain_name)
        pulumi.export('cloudfront_distribution_id', cloudfront_stack.distribution_id)
        pulumi.export('dynamodb_table_name', dynamodb_stack.table_name)
        pulumi.export('route53_zone_id', route53_stack.zone_id)

        self.register_outputs({
            'bucket_name': s3_stack.bucket_name,
            'cloudfront_domain_name': cloudfront_stack.distribution_domain_name,
            'cloudfront_distribution_id': cloudfront_stack.distribution_id,
            'dynamodb_table_name': dynamodb_stack.table_name
        })
