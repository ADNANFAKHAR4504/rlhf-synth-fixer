I'll help you create a comprehensive edge computing infrastructure using Pulumi with CloudFront, Lambda@Edge, and related AWS services. Here's the complete solution:

## lib/tap_stack.py

```python
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
```

## lib/__init__.py

```python
"""
Library module for TAP infrastructure components.
"""

from .tap_stack import TapStack, TapStackArgs

__all__ = ['TapStack', 'TapStackArgs']
```

## lib/s3_stack.py

```python
"""
S3 Stack for CloudFront origin content storage.
"""

import pulumi
from pulumi_aws import s3
from pulumi import ResourceOptions
from typing import Optional


class S3Stack(pulumi.ComponentResource):
    """
    Creates an S3 bucket to serve as CloudFront origin for static content.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:s3:S3Stack', name, None, opts)

        # Create S3 bucket for origin content
        self.bucket = s3.BucketV2(
            f"origin-bucket-{environment_suffix}",
            bucket=f"tap-cdn-origin-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket versioning
        s3.BucketVersioningV2(
            f"origin-bucket-versioning-{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption
        s3.BucketServerSideEncryptionConfigurationV2(
            f"origin-bucket-encryption-{environment_suffix}",
            bucket=self.bucket.id,
            rules=[s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        s3.BucketPublicAccessBlock(
            f"origin-bucket-public-access-block-{environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create Origin Access Control policy for CloudFront
        self.bucket_name = self.bucket.id

        self.register_outputs({
            'bucket_name': self.bucket_name,
            'bucket': self.bucket
        })
```

## lib/dynamodb_stack.py

```python
"""
DynamoDB Stack for edge configuration data.
"""

import pulumi
from pulumi_aws import dynamodb
from pulumi import ResourceOptions
from typing import Optional


class DynamoDBStack(pulumi.ComponentResource):
    """
    Creates a DynamoDB table for storing edge configuration data.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dynamodb:DynamoDBStack', name, None, opts)

        # Create DynamoDB table for edge configuration
        self.table = dynamodb.Table(
            f"edge-config-table-{environment_suffix}",
            name=f"tap-edge-config-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="configKey",
            attributes=[
                dynamodb.TableAttributeArgs(
                    name="configKey",
                    type="S"
                )
            ],
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        self.table_name = self.table.name
        self.table_arn = self.table.arn

        self.register_outputs({
            'table_name': self.table_name,
            'table_arn': self.table_arn
        })
```

## lib/lambda_edge_stack.py

```python
"""
Lambda@Edge Stack for request/response manipulation.
"""

import pulumi
from pulumi_aws import iam, lambda_, Provider
from pulumi import ResourceOptions, Output
from typing import Optional
import json


class LambdaEdgeStack(pulumi.ComponentResource):
    """
    Creates Lambda@Edge functions for viewer request and origin response manipulation.
    Note: Lambda@Edge functions must be created in us-east-1 region.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        dynamodb_table_name: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:lambda:LambdaEdgeStack', name, None, opts)

        # Create provider for us-east-1 (required for Lambda@Edge)
        us_east_1_provider = Provider(
            f"us-east-1-provider-{environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        # IAM role for Lambda@Edge
        lambda_edge_role = iam.Role(
            f"lambda-edge-role-{environment_suffix}",
            name=f"tap-lambda-edge-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "lambda.amazonaws.com",
                                "edgelambda.amazonaws.com"
                            ]
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"lambda-edge-basic-execution-{environment_suffix}",
            role=lambda_edge_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Create inline policy for DynamoDB and CloudWatch access
        lambda_edge_policy = iam.RolePolicy(
            f"lambda-edge-policy-{environment_suffix}",
            role=lambda_edge_role.id,
            policy=pulumi.Output.all(dynamodb_table_name).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            "Resource": f"arn:aws:dynamodb:*:*:table/{args[0]}"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Viewer Request Lambda function for A/B testing
        viewer_request_code = """
import json
import hashlib

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']

    # Get or create user identifier
    user_id = None
    if 'cookie' in headers:
        cookies = headers['cookie'][0]['value']
        for cookie in cookies.split(';'):
            if 'user_id=' in cookie:
                user_id = cookie.split('=')[1].strip()

    # Generate user_id if not exists
    if not user_id:
        user_id = hashlib.md5(str(headers.get('x-forwarded-for', [''])[0]['value']).encode()).hexdigest()[:16]

    # A/B test routing - hash user_id to determine variant
    variant = 'A' if int(user_id[:8], 16) % 2 == 0 else 'B'

    # Add custom headers
    headers['x-ab-variant'] = [{'key': 'X-AB-Variant', 'value': variant}]
    headers['x-user-id'] = [{'key': 'X-User-ID', 'value': user_id}]

    # Route to different origin paths based on variant
    if variant == 'B':
        request['uri'] = '/variant-b' + request['uri']

    return request
"""

        self.viewer_request_function = lambda_.Function(
            f"viewer-request-function-{environment_suffix}",
            name=f"tap-viewer-request-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=lambda_edge_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(viewer_request_code)
            }),
            publish=True,
            timeout=5,
            memory_size=128,
            tags=tags,
            opts=ResourceOptions(
                parent=self,
                provider=us_east_1_provider,
                depends_on=[lambda_edge_policy]
            )
        )

        # Origin Response Lambda function for personalization
        origin_response_code = """
import json
from datetime import datetime

def lambda_handler(event, context):
    response = event['Records'][0]['cf']['response']
    request = event['Records'][0]['cf']['request']
    headers = response['headers']

    # Add security headers
    headers['strict-transport-security'] = [{
        'key': 'Strict-Transport-Security',
        'value': 'max-age=31536000; includeSubDomains'
    }]
    headers['x-content-type-options'] = [{
        'key': 'X-Content-Type-Options',
        'value': 'nosniff'
    }]
    headers['x-frame-options'] = [{
        'key': 'X-Frame-Options',
        'value': 'DENY'
    }]
    headers['x-xss-protection'] = [{
        'key': 'X-XSS-Protection',
        'value': '1; mode=block'
    }]

    # Add custom personalization header
    request_headers = request['headers']
    if 'x-ab-variant' in request_headers:
        variant = request_headers['x-ab-variant'][0]['value']
        headers['x-personalization'] = [{
            'key': 'X-Personalization',
            'value': f'variant-{variant}'
        }]

    # Add cache control
    headers['cache-control'] = [{
        'key': 'Cache-Control',
        'value': 'public, max-age=3600'
    }]

    return response
"""

        self.origin_response_function = lambda_.Function(
            f"origin-response-function-{environment_suffix}",
            name=f"tap-origin-response-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=lambda_edge_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(origin_response_code)
            }),
            publish=True,
            timeout=5,
            memory_size=128,
            tags=tags,
            opts=ResourceOptions(
                parent=self,
                provider=us_east_1_provider,
                depends_on=[lambda_edge_policy]
            )
        )

        self.viewer_request_function_qualified_arn = self.viewer_request_function.qualified_arn
        self.origin_response_function_qualified_arn = self.origin_response_function.qualified_arn
        self.viewer_request_function_name = self.viewer_request_function.name
        self.origin_response_function_name = self.origin_response_function.name

        self.register_outputs({
            'viewer_request_function_qualified_arn': self.viewer_request_function_qualified_arn,
            'origin_response_function_qualified_arn': self.origin_response_function_qualified_arn,
            'viewer_request_function_name': self.viewer_request_function_name,
            'origin_response_function_name': self.origin_response_function_name
        })
```

## lib/waf_stack.py

```python
"""
WAF Stack for CloudFront security and geo-blocking.
"""

import pulumi
from pulumi_aws import wafv2, Provider
from pulumi import ResourceOptions
from typing import Optional


class WAFStack(pulumi.ComponentResource):
    """
    Creates AWS WAF Web ACL with geo-blocking rules for CloudFront.
    Note: WAF for CloudFront must be created in us-east-1 region.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:waf:WAFStack', name, None, opts)

        # Create provider for us-east-1 (required for CloudFront WAF)
        us_east_1_provider = Provider(
            f"waf-us-east-1-provider-{environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        # Create IP Set for additional blocking if needed
        ip_set = wafv2.IpSet(
            f"waf-ip-set-{environment_suffix}",
            name=f"tap-blocked-ips-{environment_suffix}",
            scope="CLOUDFRONT",
            ip_address_version="IPV4",
            addresses=[],
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        # Create Web ACL with geo-blocking
        self.web_acl = wafv2.WebAcl(
            f"cloudfront-web-acl-{environment_suffix}",
            name=f"tap-cloudfront-acl-{environment_suffix}",
            scope="CLOUDFRONT",
            default_action=wafv2.WebAclDefaultActionArgs(
                allow=wafv2.WebAclDefaultActionAllowArgs()
            ),
            rules=[
                # Geo-blocking rule
                wafv2.WebAclRuleArgs(
                    name="geo-blocking-rule",
                    priority=1,
                    action=wafv2.WebAclRuleActionArgs(
                        block=wafv2.WebAclRuleActionBlockArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        geo_match_statement=wafv2.WebAclRuleStatementGeoMatchStatementArgs(
                            country_codes=["CN", "RU", "KP"]
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="geo-blocking-rule",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                wafv2.WebAclRuleArgs(
                    name="rate-limiting-rule",
                    priority=2,
                    action=wafv2.WebAclRuleActionArgs(
                        block=wafv2.WebAclRuleActionBlockArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="rate-limiting-rule",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS managed rule - Common Rule Set
                wafv2.WebAclRuleArgs(
                    name="aws-managed-common-rule",
                    priority=3,
                    override_action=wafv2.WebAclRuleOverrideActionArgs(
                        none=wafv2.WebAclRuleOverrideActionNoneArgs()
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="aws-managed-common-rule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"tap-cloudfront-acl-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, provider=us_east_1_provider)
        )

        self.web_acl_id = self.web_acl.arn

        self.register_outputs({
            'web_acl_id': self.web_acl_id
        })
```

## lib/cloudfront_stack.py

```python
"""
CloudFront Stack for CDN distribution.
"""

import pulumi
from pulumi_aws import cloudfront, s3
from pulumi import ResourceOptions, Output
from typing import Optional
import json


class CloudFrontStack(pulumi.ComponentResource):
    """
    Creates CloudFront distribution with Lambda@Edge integration.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        origin_bucket: s3.BucketV2,
        viewer_request_lambda_arn: Output[str],
        origin_response_lambda_arn: Output[str],
        web_acl_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:cloudfront:CloudFrontStack', name, None, opts)

        # Origin Access Control for S3
        oac = cloudfront.OriginAccessControl(
            f"cloudfront-oac-{environment_suffix}",
            name=f"tap-oac-{environment_suffix}",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4",
            opts=ResourceOptions(parent=self)
        )

        # CloudFront distribution
        self.distribution = cloudfront.Distribution(
            f"cdn-distribution-{environment_suffix}",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"TAP CDN Distribution - {environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            web_acl_id=web_acl_id,
            origins=[
                cloudfront.DistributionOriginArgs(
                    domain_name=origin_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{environment_suffix}",
                    origin_access_control_id=oac.id
                )
            ],
            default_cache_behavior=cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{environment_suffix}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=True,
                    cookies=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="all"
                    ),
                    headers=["CloudFront-Viewer-Country", "CloudFront-Is-Mobile-Viewer"]
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                lambda_function_associations=[
                    cloudfront.DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs(
                        event_type="viewer-request",
                        lambda_arn=viewer_request_lambda_arn,
                        include_body=False
                    ),
                    cloudfront.DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs(
                        event_type="origin-response",
                        lambda_arn=origin_response_lambda_arn,
                        include_body=False
                    )
                ]
            ),
            ordered_cache_behaviors=[
                # Static assets cache behavior
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/static/*",
                    allowed_methods=["GET", "HEAD"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id=f"S3-{environment_suffix}",
                    viewer_protocol_policy="redirect-to-https",
                    compress=True,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    ),
                    min_ttl=0,
                    default_ttl=86400,
                    max_ttl=31536000
                ),
                # API cache behavior
                cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/api/*",
                    allowed_methods=["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id=f"S3-{environment_suffix}",
                    viewer_protocol_policy="redirect-to-https",
                    compress=True,
                    forwarded_values=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=True,
                        cookies=cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="all"
                        ),
                        headers=["Authorization", "CloudFront-Viewer-Country"]
                    ),
                    min_ttl=0,
                    default_ttl=0,
                    max_ttl=0
                )
            ],
            restrictions=cloudfront.DistributionRestrictionsArgs(
                geo_restriction=cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            logging_config=cloudfront.DistributionLoggingConfigArgs(
                bucket=origin_bucket.bucket_regional_domain_name,
                include_cookies=False,
                prefix="cloudfront-logs/"
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Update S3 bucket policy to allow CloudFront OAC
        bucket_policy = s3.BucketPolicy(
            f"origin-bucket-policy-{environment_suffix}",
            bucket=origin_bucket.id,
            policy=pulumi.Output.all(
                origin_bucket.arn,
                self.distribution.arn
            ).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudfront.amazonaws.com"
                            },
                            "Action": "s3:GetObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {
                                    "AWS:SourceArn": args[1]
                                }
                            }
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        self.distribution_id = self.distribution.id
        self.distribution_domain_name = self.distribution.domain_name
        self.distribution_hosted_zone_id = self.distribution.hosted_zone_id

        self.register_outputs({
            'distribution_id': self.distribution_id,
            'distribution_domain_name': self.distribution_domain_name,
            'distribution_hosted_zone_id': self.distribution_hosted_zone_id
        })
```

## lib/route53_stack.py

```python
"""
Route 53 Stack for DNS management.
"""

import pulumi
from pulumi_aws import route53
from pulumi import ResourceOptions, Output
from typing import Optional


class Route53Stack(pulumi.ComponentResource):
    """
    Creates Route 53 hosted zone and DNS records for CloudFront distribution.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        cloudfront_domain_name: Output[str],
        cloudfront_hosted_zone_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:route53:Route53Stack', name, None, opts)

        # Create hosted zone
        self.zone = route53.Zone(
            f"dns-zone-{environment_suffix}",
            name=f"tap-cdn-{environment_suffix}.example.com",
            comment=f"DNS zone for TAP CDN - {environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create A record (alias) pointing to CloudFront
        route53.Record(
            f"cloudfront-a-record-{environment_suffix}",
            zone_id=self.zone.zone_id,
            name=f"cdn.tap-cdn-{environment_suffix}.example.com",
            type="A",
            aliases=[route53.RecordAliasArgs(
                name=cloudfront_domain_name,
                zone_id=cloudfront_hosted_zone_id,
                evaluate_target_health=False
            )],
            opts=ResourceOptions(parent=self)
        )

        # Create AAAA record (IPv6 alias) pointing to CloudFront
        route53.Record(
            f"cloudfront-aaaa-record-{environment_suffix}",
            zone_id=self.zone.zone_id,
            name=f"cdn.tap-cdn-{environment_suffix}.example.com",
            type="AAAA",
            aliases=[route53.RecordAliasArgs(
                name=cloudfront_domain_name,
                zone_id=cloudfront_hosted_zone_id,
                evaluate_target_health=False
            )],
            opts=ResourceOptions(parent=self)
        )

        self.zone_id = self.zone.zone_id
        self.name_servers = self.zone.name_servers

        self.register_outputs({
            'zone_id': self.zone_id,
            'name_servers': self.name_servers
        })
```

## lib/monitoring_stack.py

```python
"""
CloudWatch Monitoring Stack for edge metrics and logging.
"""

import pulumi
from pulumi_aws import cloudwatch
from pulumi import ResourceOptions, Output
from typing import Optional, List


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates CloudWatch dashboards, alarms, and log groups for monitoring.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        distribution_id: Output[str],
        lambda_function_names: List[Output[str]],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # CloudWatch Log Group for Lambda@Edge
        for idx, function_name in enumerate(lambda_function_names):
            cloudwatch.LogGroup(
                f"lambda-edge-log-group-{idx}-{environment_suffix}",
                name=function_name.apply(lambda n: f"/aws/lambda/{n}"),
                retention_in_days=7,
                tags=tags,
                opts=ResourceOptions(parent=self)
            )

        # CloudWatch alarm for CloudFront 4xx errors
        cloudwatch.MetricAlarm(
            f"cloudfront-4xx-alarm-{environment_suffix}",
            name=f"tap-cloudfront-4xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4xxErrorRate",
            namespace="AWS/CloudFront",
            period=300,
            statistic="Average",
            threshold=5.0,
            alarm_description="Alert when CloudFront 4xx error rate exceeds 5%",
            dimensions={
                "DistributionId": distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for CloudFront 5xx errors
        cloudwatch.MetricAlarm(
            f"cloudfront-5xx-alarm-{environment_suffix}",
            name=f"tap-cloudfront-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5xxErrorRate",
            namespace="AWS/CloudFront",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when CloudFront 5xx error rate exceeds 1%",
            dimensions={
                "DistributionId": distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for Lambda@Edge errors
        for idx, function_name in enumerate(lambda_function_names):
            cloudwatch.MetricAlarm(
                f"lambda-edge-error-alarm-{idx}-{environment_suffix}",
                name=function_name.apply(lambda n: f"tap-lambda-{n}-errors-{environment_suffix}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=10,
                alarm_description="Alert when Lambda@Edge function errors exceed 10",
                dimensions={
                    "FunctionName": function_name
                },
                tags=tags,
                opts=ResourceOptions(parent=self)
            )

        self.register_outputs({})
```

This complete solution provides:

1. A CloudFront distribution with multiple cache behaviors for different content types
2. S3 bucket as origin with proper security and encryption
3. Lambda@Edge functions for A/B testing and response personalization (deployed in us-east-1)
4. DynamoDB table for storing edge configuration data
5. WAF with geo-blocking rules and rate limiting
6. Route 53 DNS setup with both IPv4 and IPv6 support
7. CloudWatch monitoring with alarms for errors and performance metrics
8. Proper IAM roles and policies for Lambda@Edge to access DynamoDB and CloudWatch
9. CloudFront KeyValueStore capability mentioned but can be added separately if needed
10. Multiple cache behaviors with appropriate TTLs

The infrastructure is modular and uses Pulumi's ComponentResource pattern for better organization and reusability.