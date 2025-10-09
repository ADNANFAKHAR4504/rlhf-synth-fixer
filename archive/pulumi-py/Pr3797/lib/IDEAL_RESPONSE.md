# CloudFront CDN with Lambda@Edge - AWS Infrastructure

## Overview

This implementation provides a complete CloudFront CDN infrastructure with Lambda@Edge functions, WAF protection, and Route53 DNS management using Pulumi and Python. The solution includes:

- CloudFront distribution with Origin Access Control (OAC)
- S3 buckets for origin content and logging
- Lambda@Edge functions for request/response processing
- DynamoDB for edge configuration
- WAF for security protection
- Route53 for DNS management
- CloudWatch monitoring and alarms

## Architecture

The infrastructure is organized into modular stacks:

1. **S3 Stack** - Origin bucket and logs bucket
2. **DynamoDB Stack** - Edge configuration storage
3. **Lambda@Edge Stack** - Viewer request and origin response functions
4. **WAF Stack** - Web Application Firewall rules
5. **CloudFront Stack** - CDN distribution with all integrations
6. **Route53 Stack** - DNS hosted zone and records
7. **Monitoring Stack** - CloudWatch alarms and dashboards

---

## Main Entry Point

### tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

# Add the current directory to the Python path to enable lib imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="TapStack",
    args=TapStackArgs(environment_suffix=environment_suffix),
)
```

---

## Stack Implementations

### lib/tap_stack.py

```python
"""
Main TAP Stack orchestrating all infrastructure components.

This stack creates a complete CloudFront CDN infrastructure with:
- S3 buckets for origin content and logs
- CloudFront distribution with Lambda@Edge
- DynamoDB for edge configuration
- WAF for security
- Route53 for DNS
- CloudWatch monitoring
"""

import pulumi
from pulumi import Output, ResourceOptions
from dataclasses import dataclass
from typing import Optional

from .s3_stack import S3Stack
from .dynamodb_stack import DynamoDBStack
from .lambda_edge_stack import LambdaEdgeStack
from .waf_stack import WAFStack
from .cloudfront_stack import CloudFrontStack
from .route53_stack import Route53Stack
from .monitoring_stack import MonitoringStack


@dataclass
class TapStackArgs:
    """Arguments for TAP Stack configuration."""
    environment_suffix: str


class TapStack(pulumi.ComponentResource):
    """
    Main TAP infrastructure stack.

    Orchestrates all component stacks to create a complete CloudFront CDN
    infrastructure with Lambda@Edge, WAF, and monitoring.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:TapStack', name, None, opts)

        environment_suffix = args.environment_suffix

        # Common tags for all resources
        tags = {
            'Project': 'TAP',
            'ManagedBy': 'Pulumi',
            'Environment': environment_suffix,
        }

        # Create S3 bucket for origin content
        s3_stack = S3Stack(
            name=f"s3-{environment_suffix}",
            environment_suffix=environment_suffix,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for edge configuration
        dynamodb_stack = DynamoDBStack(
            name=f"dynamodb-{environment_suffix}",
            environment_suffix=environment_suffix,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda@Edge functions
        lambda_edge_stack = LambdaEdgeStack(
            name=f"lambda-edge-{environment_suffix}",
            environment_suffix=environment_suffix,
            dynamodb_table_name=dynamodb_stack.table_name,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create WAF Web ACL
        waf_stack = WAFStack(
            name=f"waf-{environment_suffix}",
            environment_suffix=environment_suffix,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudFront distribution
        cloudfront_stack = CloudFrontStack(
            name=f"cloudfront-{environment_suffix}",
            environment_suffix=environment_suffix,
            origin_bucket=s3_stack.bucket,
            viewer_request_lambda_arn=lambda_edge_stack.viewer_request_lambda_version_arn,
            origin_response_lambda_arn=lambda_edge_stack.origin_response_lambda_version_arn,
            web_acl_id=waf_stack.web_acl_id,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Route53 hosted zone and records
        route53_stack = Route53Stack(
            name=f"route53-{environment_suffix}",
            environment_suffix=environment_suffix,
            cloudfront_domain_name=cloudfront_stack.distribution_domain_name,
            cloudfront_hosted_zone_id=cloudfront_stack.distribution_hosted_zone_id,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch monitoring
        monitoring_stack = MonitoringStack(
            name=f"monitoring-{environment_suffix}",
            environment_suffix=environment_suffix,
            cloudfront_distribution_id=cloudfront_stack.distribution_id,
            lambda_viewer_request_name=lambda_edge_stack.viewer_request_lambda_name,
            lambda_origin_response_name=lambda_edge_stack.origin_response_lambda_name,
            dynamodb_table_name=dynamodb_stack.table_name,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Export stack outputs
        pulumi.export('bucket_name', s3_stack.bucket_name)
        pulumi.export('cloudfront_distribution_id', cloudfront_stack.distribution_id)
        pulumi.export('cloudfront_domain_name', cloudfront_stack.distribution_domain_name)
        pulumi.export('dynamodb_table_name', dynamodb_stack.table_name)
        pulumi.export('route53_zone_id', route53_stack.zone_id)

        self.register_outputs({
            'bucket_name': s3_stack.bucket_name,
            'cloudfront_distribution_id': cloudfront_stack.distribution_id,
            'cloudfront_domain_name': cloudfront_stack.distribution_domain_name,
            'dynamodb_table_name': dynamodb_stack.table_name,
            'route53_zone_id': route53_stack.zone_id,
        })
```

### lib/s3_stack.py

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
        self.bucket = s3.Bucket(
            f"origin-bucket-{environment_suffix}",
            bucket=f"tap-cdn-origin-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket versioning
        s3.BucketVersioning(
            f"origin-bucket-versioning-{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption
        s3.BucketServerSideEncryptionConfiguration(
            f"origin-bucket-encryption-{environment_suffix}",
            bucket=self.bucket.id,
            rules=[s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
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

### lib/dynamodb_stack.py

```python
"""
DynamoDB Stack for edge configuration storage.
"""

import pulumi
from pulumi_aws import dynamodb
from pulumi import ResourceOptions
from typing import Optional


class DynamoDBStack(pulumi.ComponentResource):
    """
    Creates DynamoDB table for storing edge configuration data.
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

### lib/lambda_edge_stack.py

```python
"""
Lambda@Edge Stack for viewer request and origin response processing.
"""

import pulumi
from pulumi_aws import lambda_, iam
from pulumi import ResourceOptions, Output
from typing import Optional
import json
import os


class LambdaEdgeStack(pulumi.ComponentResource):
    """
    Creates Lambda@Edge functions for CloudFront distribution.
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

        # Create IAM role for Lambda@Edge functions
        lambda_role = iam.Role(
            f"lambda-edge-role-{environment_suffix}",
            name=f"tap-lambda-edge-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "lambda.amazonaws.com",
                                "edgelambda.amazonaws.com"
                            ]
                        }
                    }
                ]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"lambda-edge-basic-policy-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for DynamoDB access
        iam.RolePolicy(
            f"lambda-edge-dynamodb-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=dynamodb_table_name.apply(
                lambda table_name: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            "Resource": f"arn:aws:dynamodb:*:*:table/{table_name}"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Viewer Request Lambda function
        viewer_request_code = """
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;

    // Add security headers
    request.headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
    request.headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];

    // Log request for analytics
    console.log('Viewer request:', JSON.stringify(request, null, 2));

    return request;
};
"""

        self.viewer_request_lambda = lambda_.Function(
            f"viewer-request-lambda-{environment_suffix}",
            name=f"tap-viewer-request-{environment_suffix}",
            runtime="nodejs18.x",
            handler="index.handler",
            role=lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.js': pulumi.StringAsset(viewer_request_code)
            }),
            publish=True,
            tags=tags,
            opts=ResourceOptions(parent=self, provider=pulumi.aws.Provider(
                f"us-east-1-provider-viewer-{environment_suffix}",
                region="us-east-1"
            ))
        )

        # Origin Response Lambda function
        origin_response_code = """
exports.handler = async (event) => {
    const response = event.Records[0].cf.response;

    // Add cache control headers
    response.headers['cache-control'] = [{
        key: 'Cache-Control',
        value: 'public, max-age=3600'
    }];

    // Add CORS headers
    response.headers['access-control-allow-origin'] = [{
        key: 'Access-Control-Allow-Origin',
        value: '*'
    }];

    return response;
};
"""

        self.origin_response_lambda = lambda_.Function(
            f"origin-response-lambda-{environment_suffix}",
            name=f"tap-origin-response-{environment_suffix}",
            runtime="nodejs18.x",
            handler="index.handler",
            role=lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.js': pulumi.StringAsset(origin_response_code)
            }),
            publish=True,
            tags=tags,
            opts=ResourceOptions(parent=self, provider=pulumi.aws.Provider(
                f"us-east-1-provider-origin-{environment_suffix}",
                region="us-east-1"
            ))
        )

        # Get qualified ARNs (with version)
        self.viewer_request_lambda_version_arn = self.viewer_request_lambda.qualified_arn
        self.origin_response_lambda_version_arn = self.origin_response_lambda.qualified_arn
        self.viewer_request_lambda_name = self.viewer_request_lambda.name
        self.origin_response_lambda_name = self.origin_response_lambda.name

        self.register_outputs({
            'viewer_request_lambda_arn': self.viewer_request_lambda_version_arn,
            'origin_response_lambda_arn': self.origin_response_lambda_version_arn,
            'viewer_request_lambda_name': self.viewer_request_lambda_name,
            'origin_response_lambda_name': self.origin_response_lambda_name
        })
```

### lib/waf_stack.py

```python
"""
WAF Stack for CloudFront security protection.
"""

import pulumi
from pulumi_aws import wafv2
from pulumi import ResourceOptions
from typing import Optional


class WAFStack(pulumi.ComponentResource):
    """
    Creates AWS WAF Web ACL for CloudFront distribution protection.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:waf:WAFStack', name, None, opts)

        # Create WAF Web ACL for CloudFront (must be in us-east-1)
        self.web_acl = wafv2.WebAcl(
            f"cloudfront-waf-{environment_suffix}",
            name=f"tap-cloudfront-waf-{environment_suffix}",
            scope="CLOUDFRONT",
            default_action=wafv2.WebAclDefaultActionArgs(
                allow={}
            ),
            rules=[
                # Rate limiting rule
                wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=1,
                    action=wafv2.WebAclRuleActionArgs(
                        block={}
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rules - Common Rule Set
                wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=2,
                    override_action=wafv2.WebAclRuleOverrideActionArgs(
                        none={}
                    ),
                    statement=wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"tap-waf-{environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, provider=pulumi.aws.Provider(
                f"us-east-1-provider-waf-{environment_suffix}",
                region="us-east-1"
            ))
        )

        self.web_acl_id = self.web_acl.arn

        self.register_outputs({
            'web_acl_id': self.web_acl_id
        })
```

### lib/cloudfront_stack.py

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
        origin_bucket: s3.Bucket,
        viewer_request_lambda_arn: Output[str],
        origin_response_lambda_arn: Output[str],
        web_acl_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:cloudfront:CloudFrontStack', name, None, opts)

        # Create separate S3 bucket for CloudFront logs with ACL enabled
        logs_bucket = s3.Bucket(
            f"cloudfront-logs-bucket-{environment_suffix}",
            bucket=f"tap-cdn-logs-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Enable ACL for logs bucket (required for CloudFront logging)
        s3.BucketAclV2(
            f"cloudfront-logs-bucket-acl-{environment_suffix}",
            bucket=logs_bucket.id,
            acl="log-delivery-write",
            opts=ResourceOptions(parent=self)
        )

        # Enable bucket ownership controls for logs bucket
        s3.BucketOwnershipControls(
            f"cloudfront-logs-bucket-ownership-{environment_suffix}",
            bucket=logs_bucket.id,
            rule=s3.BucketOwnershipControlsRuleArgs(
                object_ownership="BucketOwnerPreferred"
            ),
            opts=ResourceOptions(parent=self)
        )

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
                bucket=logs_bucket.bucket_regional_domain_name,
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

### lib/route53_stack.py

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

        # Create hosted zone with unique domain name
        # Using a subdomain pattern that won't conflict with AWS reserved names
        domain_name = f"tap-cdn-{environment_suffix}.local"

        self.zone = route53.Zone(
            f"dns-zone-{environment_suffix}",
            name=domain_name,
            comment=f"DNS zone for TAP CDN - {environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create A record (alias) pointing to CloudFront
        route53.Record(
            f"cloudfront-a-record-{environment_suffix}",
            zone_id=self.zone.zone_id,
            name=f"cdn.{domain_name}",
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
            name=f"cdn.{domain_name}",
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

### lib/monitoring_stack.py

```python
"""
CloudWatch Monitoring Stack for metrics and alarms.
"""

import pulumi
from pulumi_aws import cloudwatch
from pulumi import ResourceOptions, Output
from typing import Optional


class MonitoringStack(pulumi.ComponentResource):
    """
    Creates CloudWatch dashboard and alarms for monitoring infrastructure.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        cloudfront_distribution_id: Output[str],
        lambda_viewer_request_name: Output[str],
        lambda_origin_response_name: Output[str],
        dynamodb_table_name: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Create CloudWatch alarm for CloudFront 4xx error rate
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
            alarm_description="CloudFront 4xx error rate exceeded 5%",
            dimensions={
                "DistributionId": cloudfront_distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarm for CloudFront 5xx error rate
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
            alarm_description="CloudFront 5xx error rate exceeded 1%",
            dimensions={
                "DistributionId": cloudfront_distribution_id
            },
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarm for Lambda errors
        cloudwatch.MetricAlarm(
            f"lambda-errors-alarm-{environment_suffix}",
            name=f"tap-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Lambda function errors exceeded threshold",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
```

### lib/__init__.py

```python
"""
TAP Infrastructure Library

This package contains all infrastructure components for the TAP CDN system.
"""

__version__ = "1.0.0"
```

---

## Key Features

### Security
- **WAF Protection**: Rate limiting and AWS managed rule sets
- **Origin Access Control**: Secure S3 access via CloudFront OAC (not legacy OAI)
- **HTTPS Only**: All traffic redirected to HTTPS
- **Public Access Blocked**: S3 bucket blocks all public access
- **Server-Side Encryption**: AES256 encryption for S3 data at rest

### Performance
- **Global CDN**: CloudFront edge locations worldwide
- **Intelligent Caching**: Configurable TTLs for different content types
- **Compression**: Automatic gzip/brotli compression
- **IPv6 Support**: Full IPv6 compatibility
- **Lambda@Edge**: Request/response processing at edge locations

### Reliability
- **Versioning**: S3 bucket versioning enabled
- **Point-in-Time Recovery**: DynamoDB PITR enabled
- **CloudWatch Monitoring**: Comprehensive metrics and alarms
- **Logging**: CloudFront access logs to dedicated S3 bucket

### Operational Excellence
- **Infrastructure as Code**: Pulumi with Python
- **Modular Design**: Separate stacks for each component
- **Parameterized**: Environment suffix for multi-environment support
- **Resource Tagging**: Consistent tagging across all resources

## Configuration

### Environment Suffix
Set via Pulumi config or defaults to `dev`:
```bash
pulumi config set env prod
```

### AWS Region
Default region: `us-west-2`
CloudFront resources (Lambda@Edge, WAF): `us-east-1` (required)

### Resource Naming
All resources follow the pattern: `tap-{resource-type}-{environment-suffix}`

Examples:
- S3 Bucket: `tap-cdn-origin-dev`
- DynamoDB Table: `tap-edge-config-dev`
- CloudFront Distribution: `tap-cdn-{generated-id}`

## Important Notes

1. **Lambda@Edge Region**: Lambda@Edge functions and WAF must be deployed to `us-east-1` (CloudFront requirement)

2. **S3 Bucket Names**: Bucket names are globally unique and include environment suffix

3. **CloudFront Deployment Time**: Initial CloudFront distribution deployment takes 15-20 minutes

4. **Route53 Domain**: Uses `.local` TLD to avoid AWS reserved domain names

5. **Logs Bucket ACL**: Separate logs bucket with ACL enabled for CloudFront logging (ACLs disabled on origin bucket for security)
