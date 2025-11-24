
#!/usr/bin/env python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionOriginOriginShield,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValues,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionRestrictionsGeoRestriction,
    CloudfrontDistributionViewerCertificate,
)
from cdktf_cdktf_provider_aws.cloudfront_origin_access_control import CloudfrontOriginAccessControl
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleAction,
    Wafv2WebAclRuleActionBlock,
    Wafv2WebAclRuleActionAllow,
    Wafv2WebAclRuleVisibilityConfig,
    Wafv2WebAclDefaultAction,
    Wafv2WebAclVisibilityConfig,
)
from cdktf_cdktf_provider_aws.wafv2_ip_set import Wafv2IpSet
from cdktf_cdktf_provider_aws.wafv2_web_acl_logging_configuration import (
    Wafv2WebAclLoggingConfiguration,
)
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import (
    DataAwsIamPolicyDocument,
    DataAwsIamPolicyDocumentStatement,
)
import json


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        stack_id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: dict,
    ):
        super().__init__(scope, stack_id)

        # Store parameters
        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.default_tags = default_tags

        # Configure S3 backend for Terraform state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"tap-stack-{environment_suffix}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # AWS Provider for us-east-1 (WAF and CloudFront requirement)
        self.provider_us_east_1 = AwsProvider(
            self,
            "aws-us-east-1",
            region="us-east-1",
            default_tags=[default_tags],
            alias="us_east_1",
        )

        # AWS Provider for us-west-2 (S3 bucket)
        self.provider_us_west_2 = AwsProvider(
            self,
            "aws-us-west-2",
            region="us-west-2",
            default_tags=[default_tags],
            alias="us_west_2",
        )

        # Create resource tags
        self.resource_tags = {
            "Environment": environment_suffix,
            "Project": "WAF-CloudFront",
            "CostCenter": "Security",
        }

        # Create S3 bucket for CloudFront origin
        self.create_s3_origin()

        # Create IP set for allowlisting
        self.create_ip_allowlist()

        # Create CloudWatch Log Group for WAF logs
        self.create_log_group()

        # Create WAF WebACL
        self.create_waf_webacl()

        # Create CloudFront distribution
        self.create_cloudfront_distribution()

        # Configure WAF logging
        self.configure_waf_logging()

        # Create outputs
        self.create_outputs()

    def create_s3_origin(self):
        """Create S3 bucket for CloudFront origin with versioning and security settings"""
        # Create S3 bucket in us-west-2
        self.origin_bucket = S3Bucket(
            self,
            "origin-bucket",
            bucket=f"waf-cloudfront-origin-{self.environment_suffix}",
            provider=self.provider_us_west_2,
            tags=self.resource_tags,
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "origin-bucket-versioning",
            bucket=self.origin_bucket.id,
            provider=self.provider_us_west_2,
            versioning_configuration={"status": "Enabled"},
        )

        # Block all public access
        S3BucketPublicAccessBlock(
            self,
            "origin-bucket-public-access-block",
            bucket=self.origin_bucket.id,
            provider=self.provider_us_west_2,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Note: The bucket policy will be created after CloudFront distribution
        # to reference the actual distribution ARN (see create_cloudfront_distribution method)

    def create_ip_allowlist(self):
        """Create IP set for allowlisting office IPs"""
        self.ip_allowlist = Wafv2IpSet(
            self,
            "ip-allowlist",
            name=f"office-ip-allowlist-{self.environment_suffix}",
            description="Office IP addresses for allowlisting",
            scope="CLOUDFRONT",
            ip_address_version="IPV4",
            addresses=[
                "203.0.113.0/24",
                "198.51.100.0/24",
            ],
            provider=self.provider_us_east_1,
            tags=self.resource_tags,
        )

    def create_log_group(self):
        """Create CloudWatch Log Group for WAF logs"""
        self.waf_log_group = CloudwatchLogGroup(
            self,
            "waf-log-group",
            name=f"aws-waf-logs-{self.environment_suffix}",
            retention_in_days=30,
            provider=self.provider_us_east_1,
            tags=self.resource_tags,
        )

    def create_waf_webacl(self):
        """Create WAF v2 WebACL with all required rules"""
        # Define WAF rules with proper ordering
        waf_rules = []

        # Rule 1: IP Allowlist (Priority 1 - Highest)
        waf_rules.append(
            Wafv2WebAclRule(
                name="IPAllowlistRule",
                priority=1,
                action=Wafv2WebAclRuleAction(
                    allow=Wafv2WebAclRuleActionAllow(),
                ),
                statement={
                    "ip_set_reference_statement": {
                        "arn": self.ip_allowlist.arn,
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="IPAllowlistRule",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Rule 2: Rate-based rule (2000 requests per 5 minutes)
        waf_rules.append(
            Wafv2WebAclRule(
                name="RateLimitRule",
                priority=2,
                action=Wafv2WebAclRuleAction(
                    block=Wafv2WebAclRuleActionBlock(),
                ),
                statement={
                    "rate_based_statement": {
                        "limit": 2000,
                        "aggregate_key_type": "IP",
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="RateLimitRule",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Rule 3: AWS Managed Rules - Common Rule Set
        waf_rules.append(
            Wafv2WebAclRule(
                name="AWSManagedRulesCommonRuleSet",
                priority=3,
                override_action={
                    "none": {},
                },
                statement={
                    "managed_rule_group_statement": {
                        "vendor_name": "AWS",
                        "name": "AWSManagedRulesCommonRuleSet",
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="AWSManagedRulesCommonRuleSet",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Rule 4: AWS Managed Rules - Known Bad Inputs
        waf_rules.append(
            Wafv2WebAclRule(
                name="AWSManagedRulesKnownBadInputsRuleSet",
                priority=4,
                override_action={
                    "none": {},
                },
                statement={
                    "managed_rule_group_statement": {
                        "vendor_name": "AWS",
                        "name": "AWSManagedRulesKnownBadInputsRuleSet",
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="AWSManagedRulesKnownBadInputsRuleSet",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Rule 5: Custom SQL Injection rule
        waf_rules.append(
            Wafv2WebAclRule(
                name="SQLInjectionRule",
                priority=5,
                action=Wafv2WebAclRuleAction(
                    block=Wafv2WebAclRuleActionBlock(),
                ),
                statement={
                    "sqli_match_statement": {
                        "field_to_match": {
                            "query_string": {},
                        },
                        "text_transformation": [
                            {
                                "priority": 0,
                                "type": "URL_DECODE",
                            },
                            {
                                "priority": 1,
                                "type": "HTML_ENTITY_DECODE",
                            },
                        ],
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="SQLInjectionRule",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Rule 6: Geo-blocking rule (Allow only US, CA, UK)
        waf_rules.append(
            Wafv2WebAclRule(
                name="GeoBlockingRule",
                priority=6,
                action=Wafv2WebAclRuleAction(
                    block=Wafv2WebAclRuleActionBlock(),
                ),
                statement={
                    "not_statement": {
                        "statement": {
                            "geo_match_statement": {
                                "country_codes": ["US", "CA", "GB"],
                            },
                        },
                    },
                },
                visibility_config=Wafv2WebAclRuleVisibilityConfig(
                    cloudwatch_metrics_enabled=True,
                    metric_name="GeoBlockingRule",
                    sampled_requests_enabled=True,
                ),
            )
        )

        # Create WAF WebACL
        self.waf_webacl = Wafv2WebAcl(
            self,
            "waf-webacl",
            name=f"waf-webacl-{self.environment_suffix}",
            description="WAF WebACL for CloudFront distribution protection",
            scope="CLOUDFRONT",
            default_action=Wafv2WebAclDefaultAction(
                allow={},
            ),
            rule=waf_rules,
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"WAFWebACL-{self.environment_suffix}",
                sampled_requests_enabled=True,
            ),
            provider=self.provider_us_east_1,
            tags=self.resource_tags,
        )

    def create_cloudfront_distribution(self):
        """Create CloudFront distribution with S3 origin and WAF association"""
        # Create Origin Access Control
        self.oac = CloudfrontOriginAccessControl(
            self,
            "cloudfront-oac",
            name=f"oac-{self.environment_suffix}",
            description="Origin Access Control for S3 bucket",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4",
            provider=self.provider_us_east_1,
        )

        # Create CloudFront distribution
        self.cloudfront_distribution = CloudfrontDistribution(
            self,
            "cloudfront-distribution",
            enabled=True,
            comment=f"CloudFront distribution with WAF protection - {self.environment_suffix}",
            default_root_object="index.html",
            price_class="PriceClass_100",
            web_acl_id=self.waf_webacl.arn,
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=self.origin_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-{self.origin_bucket.id}",
                    origin_access_control_id=self.oac.id,
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-{self.origin_bucket.id}",
                viewer_protocol_policy="https-only",
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                compress=True,
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=False,
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="none"
                    ),
                ),
            ),
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none",
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True,
                minimum_protocol_version="TLSv1.2_2021",
            ),
            provider=self.provider_us_east_1,
            tags=self.resource_tags,
        )

        # Update S3 bucket policy to allow CloudFront OAC access
        S3BucketPolicy(
            self,
            "origin-bucket-policy",
            bucket=self.origin_bucket.id,
            provider=self.provider_us_west_2,
            policy=Fn.jsonencode(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyNonHTTPS",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                self.origin_bucket.arn,
                                f"{self.origin_bucket.arn}/*",
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": "false",
                                }
                            },
                        },
                        {
                            "Sid": "AllowCloudFrontServicePrincipal",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudfront.amazonaws.com",
                            },
                            "Action": "s3:GetObject",
                            "Resource": f"{self.origin_bucket.arn}/*",
                            "Condition": {
                                "StringEquals": {
                                    "AWS:SourceArn": self.cloudfront_distribution.arn,
                                }
                            },
                        },
                    ],
                }
            ),
        )

    def configure_waf_logging(self):
        """Configure WAF logging to CloudWatch"""
        # Create IAM role for WAF logging
        waf_logging_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "waf-logging-assume-role-policy",
            provider=self.provider_us_east_1,
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[
                        {
                            "type": "Service",
                            "identifiers": ["wafv2.amazonaws.com"],
                        }
                    ],
                    actions=["sts:AssumeRole"],
                )
            ],
        )

        self.waf_logging_role = IamRole(
            self,
            "waf-logging-role",
            name=f"waf-logging-role-{self.environment_suffix}",
            assume_role_policy=waf_logging_assume_role_policy.json,
            provider=self.provider_us_east_1,
            tags=self.resource_tags,
        )

        # Create IAM policy for WAF to write to CloudWatch Logs
        waf_logging_policy = DataAwsIamPolicyDocument(
            self,
            "waf-logging-policy-doc",
            provider=self.provider_us_east_1,
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    actions=[
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    resources=[f"{self.waf_log_group.arn}:*"],
                )
            ],
        )

        IamRolePolicy(
            self,
            "waf-logging-role-policy",
            name="waf-logging-policy",
            role=self.waf_logging_role.id,
            policy=waf_logging_policy.json,
            provider=self.provider_us_east_1,
        )

        # Configure WAF logging
        Wafv2WebAclLoggingConfiguration(
            self,
            "waf-logging-config",
            resource_arn=self.waf_webacl.arn,
            log_destination_configs=[self.waf_log_group.arn],
            provider=self.provider_us_east_1,
        )

    def create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(
            self,
            "cloudfront_distribution_id",
            value=self.cloudfront_distribution.id,
            description="CloudFront Distribution ID",
        )

        TerraformOutput(
            self,
            "cloudfront_distribution_domain_name",
            value=self.cloudfront_distribution.domain_name,
            description="CloudFront Distribution Domain Name",
        )

        TerraformOutput(
            self,
            "waf_webacl_id",
            value=self.waf_webacl.id,
            description="WAF WebACL ID",
        )

        TerraformOutput(
            self,
            "waf_webacl_arn",
            value=self.waf_webacl.arn,
            description="WAF WebACL ARN",
        )

        TerraformOutput(
            self,
            "origin_bucket_name",
            value=self.origin_bucket.id,
            description="S3 Origin Bucket Name",
        )

        TerraformOutput(
            self,
            "waf_log_group_name",
            value=self.waf_log_group.name,
            description="WAF CloudWatch Log Group Name",
        )
