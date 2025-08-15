I'll create a comprehensive Pulumi program that meets all your requirements. Let me implement this step by step.

## lib/tap_stack.py

```python
"""
Multi-Region Static Website Infrastructure Stack

This Pulumi stack deploys a highly available, secure static website across
multiple AWS regions with global content delivery, comprehensive security,
and monitoring capabilities.

Architecture:
- Multi-region S3 buckets (us-west-2, us-east-1) for redundancy
- CloudFront distribution for global content delivery
- Route 53 for DNS management and health checks
- WAF for web application security
- ACM certificates for HTTPS
- Comprehensive IAM roles following least privilege
- CloudWatch logging and monitoring
"""

import json
from typing import Dict, List, Optional, Tuple

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, ResourceOptions


class TapStack:
    """
    Main infrastructure stack for the static website deployment.
    
    This class encapsulates all AWS resources needed for a production-ready
    static website with multi-region deployment, security, and monitoring.
    """
    
    def __init__(self):
        """Initialize the stack with configuration and create all resources."""
        self.config = Config()
        self.stack_name = pulumi.get_stack()
        self.project_name = pulumi.get_project()
        
        # Configuration with sensible defaults
        self.domain_name = self.config.require("domain_name")
        self.primary_region = self.config.get("primary_region") or "us-west-2"
        self.secondary_region = self.config.get("secondary_region") or "us-east-1"
        self.environment = self.config.get("environment") or "production"
        
        # Common tags for all resources
        self.common_tags = {
            "Project": self.project_name,
            "Environment": self.environment,
            "Stack": self.stack_name,
            "ManagedBy": "Pulumi"
        }
        
        # Initialize providers for multi-region deployment
        self._setup_providers()
        
        # Create KMS keys for encryption
        self.kms_keys = self._create_kms_keys()
        
        # Create S3 buckets in both regions
        self.s3_buckets = self._create_s3_buckets()
        
        # Create CloudWatch log groups
        self.log_groups = self._create_cloudwatch_logs()
        
        # Create IAM roles and policies
        self.iam_resources = self._create_iam_resources()
        
        # Create ACM certificates
        self.certificates = self._create_acm_certificates()
        
        # Create WAF resources
        self.waf_resources = self._create_waf_resources()
        
        # Create CloudFront distribution
        self.cloudfront = self._create_cloudfront_distribution()
        
        # Create Route 53 resources
        self.route53_resources = self._create_route53_resources()
        
        # Set up monitoring and alarms
        self.monitoring = self._create_monitoring()
        
        # Export important outputs
        self._create_outputs()
    
    def _setup_providers(self) -> None:
        """Set up AWS providers for multi-region deployment."""
        self.primary_provider = aws.Provider(
            "primary",
            region=self.primary_region,
            default_tags={
                "tags": self.common_tags
            }
        )
        
        self.secondary_provider = aws.Provider(
            "secondary",
            region=self.secondary_region,
            default_tags={
                "tags": self.common_tags
            }
        )
        
        # CloudFront and Route 53 require us-east-1
        self.global_provider = aws.Provider(
            "global",
            region="us-east-1",
            default_tags={
                "tags": self.common_tags
            }
        )
    
    def _create_kms_keys(self) -> Dict[str, aws.kms.Key]:
        """
        Create KMS keys for S3 bucket encryption in both regions.
        
        Returns:
            Dict containing KMS keys for primary and secondary regions
        """
        kms_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {"AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"},
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow S3 Service",
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }
        
        primary_key = aws.kms.Key(
            "primary-s3-key",
            description=f"KMS key for S3 encryption in {self.primary_region}",
            policy=json.dumps(kms_policy),
            tags={**self.common_tags, "Region": self.primary_region},
            opts=ResourceOptions(provider=self.primary_provider)
        )
        
        secondary_key = aws.kms.Key(
            "secondary-s3-key",
            description=f"KMS key for S3 encryption in {self.secondary_region}",
            policy=json.dumps(kms_policy),
            tags={**self.common_tags, "Region": self.secondary_region},
            opts=ResourceOptions(provider=self.secondary_provider)
        )
        
        # Create aliases for easier management
        aws.kms.Alias(
            "primary-s3-key-alias",
            name=f"alias/{self.project_name}-{self.stack_name}-primary-s3",
            target_key_id=primary_key.key_id,
            opts=ResourceOptions(provider=self.primary_provider)
        )
        
        aws.kms.Alias(
            "secondary-s3-key-alias",
            name=f"alias/{self.project_name}-{self.stack_name}-secondary-s3",
            target_key_id=secondary_key.key_id,
            opts=ResourceOptions(provider=self.secondary_provider)
        )
        
        return {
            "primary": primary_key,
            "secondary": secondary_key
        }
    
    def _create_s3_buckets(self) -> Dict[str, aws.s3.Bucket]:
        """
        Create S3 buckets in both regions with static website hosting,
        versioning, encryption, and access logging.
        
        Returns:
            Dict containing S3 buckets for primary and secondary regions
        """
        # Create access logging buckets first
        primary_log_bucket = aws.s3.Bucket(
            "primary-access-logs",
            bucket=f"{self.project_name}-{self.stack_name}-logs-{self.primary_region}",
            tags={**self.common_tags, "Purpose": "AccessLogs", "Region": self.primary_region},
            opts=ResourceOptions(provider=self.primary_provider)
        )
        
        secondary_log_bucket = aws.s3.Bucket(
            "secondary-access-logs",
            bucket=f"{self.project_name}-{self.stack_name}-logs-{self.secondary_region}",
            tags={**self.common_tags, "Purpose": "AccessLogs", "Region": self.secondary_region},
            opts=ResourceOptions(provider=self.secondary_provider)
        )
        
        # Block public access for log buckets
        for log_bucket, provider in [(primary_log_bucket, self.primary_provider), 
                                   (secondary_log_bucket, self.secondary_provider)]:
            aws.s3.BucketPublicAccessBlock(
                f"{log_bucket._name}-pab",
                bucket=log_bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(provider=provider)
            )
        
        # Create main website buckets
        primary_bucket = aws.s3.Bucket(
            "primary-website",
            bucket=f"{self.project_name}-{self.stack_name}-{self.primary_region}",
            tags={**self.common_tags, "Purpose": "Website", "Region": self.primary_region},
            opts=ResourceOptions(provider=self.primary_provider)
        )
        
        secondary_bucket = aws.s3.Bucket(
            "secondary-website",
            bucket=f"{self.project_name}-{self.stack_name}-{self.secondary_region}",
            tags={**self.common_tags, "Purpose": "Website", "Region": self.secondary_region},
            opts=ResourceOptions(provider=self.secondary_provider)
        )
        
        # Configure website hosting, versioning, encryption, and logging for both buckets
        buckets_config = [
            (primary_bucket, self.primary_provider, self.kms_keys["primary"], primary_log_bucket),
            (secondary_bucket, self.secondary_provider, self.kms_keys["secondary"], secondary_log_bucket)
        ]
        
        for bucket, provider, kms_key, log_bucket in buckets_config:
            # Website configuration
            aws.s3.BucketWebsiteConfigurationV2(
                f"{bucket._name}-website",
                bucket=bucket.id,
                index_document=aws.s3.BucketWebsiteConfigurationV2IndexDocumentArgs(
                    suffix="index.html"
                ),
                error_document=aws.s3.BucketWebsiteConfigurationV2ErrorDocumentArgs(
                    key="error.html"
                ),
                opts=ResourceOptions(provider=provider)
            )
            
            # Versioning
            aws.s3.BucketVersioningV2(
                f"{bucket._name}-versioning",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=ResourceOptions(provider=provider)
            )
            
            # Server-side encryption
            aws.s3.BucketServerSideEncryptionConfigurationV2(
                f"{bucket._name}-encryption",
                bucket=bucket.id,
                rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=kms_key.arn
                    ),
                    bucket_key_enabled=True
                )],
                opts=ResourceOptions(provider=provider)
            )
            
            # Access logging
            aws.s3.BucketLoggingV2(
                f"{bucket._name}-logging",
                bucket=bucket.id,
                target_bucket=log_bucket.id,
                target_prefix=f"access-logs/{bucket._name}/",
                opts=ResourceOptions(provider=provider)
            )
            
            # Public access block (will be managed by CloudFront OAC)
            aws.s3.BucketPublicAccessBlock(
                f"{bucket._name}-pab",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(provider=provider)
            )
        
        return {
            "primary": primary_bucket,
            "secondary": secondary_bucket,
            "primary_logs": primary_log_bucket,
            "secondary_logs": secondary_log_bucket
        }
    
    def _create_cloudwatch_logs(self) -> Dict[str, aws.cloudwatch.LogGroup]:
        """
        Create CloudWatch log groups for monitoring and debugging.
        
        Returns:
            Dict containing CloudWatch log groups
        """
        cloudfront_log_group = aws.cloudwatch.LogGroup(
            "cloudfront-logs",
            name=f"/aws/cloudfront/{self.project_name}-{self.stack_name}",
            retention_in_days=30,
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        waf_log_group = aws.cloudwatch.LogGroup(
            "waf-logs",
            name=f"/aws/wafv2/{self.project_name}-{self.stack_name}",
            retention_in_days=30,
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        return {
            "cloudfront": cloudfront_log_group,
            "waf": waf_log_group
        }
    
    def _create_iam_resources(self) -> Dict[str, aws.iam.Role]:
        """
        Create IAM roles and policies following the principle of least privilege.
        
        Returns:
            Dict containing IAM roles
        """
        # CloudFront Origin Access Control role
        cloudfront_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudfront.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # S3 access policy for CloudFront OAC
        s3_access_policy = Output.all(
            self.s3_buckets["primary"].arn,
            self.s3_buckets["secondary"].arn
        ).apply(lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": [
                        f"{arns[0]}/*",
                        f"{arns[1]}/*"
                    ]
                }
            ]
        }))
        
        cloudfront_role = aws.iam.Role(
            "cloudfront-oac-role",
            assume_role_policy=json.dumps(cloudfront_assume_role_policy),
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        aws.iam.RolePolicy(
            "cloudfront-s3-policy",
            role=cloudfront_role.id,
            policy=s3_access_policy,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        return {
            "cloudfront": cloudfront_role
        }
    
    def _create_acm_certificates(self) -> Dict[str, aws.acm.Certificate]:
        """
        Create ACM certificates for HTTPS access.
        CloudFront requires certificates to be in us-east-1.
        
        Returns:
            Dict containing ACM certificates
        """
        # Certificate for CloudFront (must be in us-east-1)
        certificate = aws.acm.Certificate(
            "ssl-certificate",
            domain_name=self.domain_name,
            subject_alternative_names=[f"*.{self.domain_name}"],
            validation_method="DNS",
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        return {
            "cloudfront": certificate
        }
    
    def _create_waf_resources(self) -> Dict[str, aws.wafv2.WebAcl]:
        """
        Create AWS WAF resources for web application security.
        
        Returns:
            Dict containing WAF resources
        """
        # WAF Web ACL with common security rules
        web_acl = aws.wafv2.WebAcl(
            "website-waf",
            name=f"{self.project_name}-{self.stack_name}-waf",
            description="WAF for static website protection",
            scope="CLOUDFRONT",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                # AWS Managed Rule: Core Rule Set
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rule: Known Bad Inputs
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="KnownBadInputsMetric",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                aws.wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=3,
                    action=aws.wafv2.WebAclRuleActionArgs(block={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name="WebsiteWAF",
                sampled_requests_enabled=True
            ),
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # WAF logging configuration
        aws.wafv2.WebAclLoggingConfiguration(
            "waf-logging",
            resource_arn=web_acl.arn,
            log_destination_configs=[self.log_groups["waf"].arn],
            opts=ResourceOptions(
                provider=self.global_provider,
                depends_on=[self.log_groups["waf"]]
            )
        )
        
        return {
            "web_acl": web_acl
        }
    
    def _create_cloudfront_distribution(self) -> aws.cloudfront.Distribution:
        """
        Create CloudFront distribution for global content delivery.
        
        Returns:
            CloudFront distribution
        """
        # Origin Access Control for S3
        oac = aws.cloudfront.OriginAccessControl(
            "s3-oac",
            name=f"{self.project_name}-{self.stack_name}-oac",
            description="OAC for S3 static website",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4",
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # CloudFront distribution
        distribution = aws.cloudfront.Distribution(
            "website-distribution",
            aliases=[self.domain_name, f"www.{self.domain_name}"],
            comment=f"CloudFront distribution for {self.domain_name}",
            default_root_object="index.html",
            enabled=True,
            is_ipv6_enabled=True,
            price_class="PriceClass_100",  # Cost-effective: US, Canada, Europe
            
            # Origins configuration with failover
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.s3_buckets["primary"].bucket_domain_name,
                    origin_id="primary-s3",
                    origin_access_control_id=oac.id,
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=""  # Empty for OAC
                    )
                ),
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.s3_buckets["secondary"].bucket_domain_name,
                    origin_id="secondary-s3",
                    origin_access_control_id=oac.id,
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=""  # Empty for OAC
                    )
                )
            ],
            
            # Origin groups for failover
            origin_groups=[
                aws.cloudfront.DistributionOriginGroupArgs(
                    origin_id="s3-failover-group",
                    failover_criteria=aws.cloudfront.DistributionOriginGroupFailoverCriteriaArgs(
                        status_codes=[403, 404, 500, 502, 503, 504]
                    ),
                    members=[
                        aws.cloudfront.DistributionOriginGroupMemberArgs(
                            origin_id="primary-s3"
                        ),
                        aws.cloudfront.DistributionOriginGroupMemberArgs(
                            origin_id="secondary-s3"
                        )
                    ]
                )
            ],
            
            # Default cache behavior
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id="s3-failover-group",
                viewer_protocol_policy="redirect-to-https",
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                compress=True,
                cache_policy_id="4135ea2d-6df8-44a3-9df3-4b5a84be39ad",  # Managed-CachingOptimized
                origin_request_policy_id="88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",  # Managed-CORS-S3Origin
                response_headers_policy_id="5cc3b908-e619-4b99-88e5-2cf7f45965bd"  # Managed-SimpleCORS
            ),
            
            # Custom error pages
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=404,
                    response_page_path="/error.html",
                    error_caching_min_ttl=300
                ),
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=403,
                    response_code=403,
                    response_page_path="/error.html",
                    error_caching_min_ttl=300
                )
            ],
            
            # Geographic restrictions (none for global access)
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            
            # SSL/TLS configuration
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                acm_certificate_arn=self.certificates["cloudfront"].arn,
                ssl_support_method="sni-only",
                minimum_protocol_version="TLSv1.2_2021"
            ),
            
            # WAF association
            web_acl_id=self.waf_resources["web_acl"].arn,
            
            # Logging configuration
            logging_config=aws.cloudfront.DistributionLoggingConfigArgs(
                bucket=f"{self.project_name}-{self.stack_name}-cloudfront-logs.s3.amazonaws.com",
                include_cookies=False,
                prefix="cloudfront-logs/"
            ),
            
            tags=self.common_tags,
            opts=ResourceOptions(
                provider=self.global_provider,
                depends_on=[self.certificates["cloudfront"], self.waf_resources["web_acl"]]
            )
        )
        
        # Update S3 bucket policies to allow CloudFront OAC access
        for bucket_name, bucket in [("primary", self.s3_buckets["primary"]), 
                                  ("secondary", self.s3_buckets["secondary"])]:
            provider = self.primary_provider if bucket_name == "primary" else self.secondary_provider
            
            bucket_policy = Output.all(bucket.arn, distribution.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudfront.amazonaws.com"},
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
            )
            
            aws.s3.BucketPolicy(
                f"{bucket_name}-bucket-policy",
                bucket=bucket.id,
                policy=bucket_policy,
                opts=ResourceOptions(
                    provider=provider,
                    depends_on=[distribution]
                )
            )
        
        return distribution
    
    def _create_route53_resources(self) -> Dict[str, aws.route53.Record]:
        """
        Create Route 53 hosted zone and DNS records.
        
        Returns:
            Dict containing Route 53 resources
        """
        # Create hosted zone
        hosted_zone = aws.route53.Zone(
            "main-zone",
            name=self.domain_name,
            comment=f"Hosted zone for {self.domain_name}",
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # Create A record for apex domain
        apex_record = aws.route53.Record(
            "apex-record",
            zone_id=hosted_zone.zone_id,
            name=self.domain_name,
            type="A",
            aliases=[aws.route53.RecordAliasArgs(
                name=self.cloudfront.domain_name,
                zone_id=self.cloudfront.hosted_zone_id,
                evaluate_target_health=True
            )],
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # Create AAAA record for IPv6
        ipv6_record = aws.route53.Record(
            "ipv6-record",
            zone_id=hosted_zone.zone_id,
            name=self.domain_name,
            type="AAAA",
            aliases=[aws.route53.RecordAliasArgs(
                name=self.cloudfront.domain_name,
                zone_id=self.cloudfront.hosted_zone_id,
                evaluate_target_health=True
            )],
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # Create www subdomain record
        www_record = aws.route53.Record(
            "www-record",
            zone_id=hosted_zone.zone_id,
            name=f"www.{self.domain_name}",
            type="A",
            aliases=[aws.route53.RecordAliasArgs(
                name=self.cloudfront.domain_name,
                zone_id=self.cloudfront.hosted_zone_id,
                evaluate_target_health=True
            )],
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        return {
            "hosted_zone": hosted_zone,
            "apex": apex_record,
            "ipv6": ipv6_record,
            "www": www_record
        }
    
    def _create_monitoring(self) -> Dict[str, aws.cloudwatch.MetricAlarm]:
        """
        Create CloudWatch alarms for monitoring.
        
        Returns:
            Dict containing CloudWatch alarms
        """
        # CloudFront error rate alarm
        error_rate_alarm = aws.cloudwatch.MetricAlarm(
            "cloudfront-error-rate",
            alarm_name=f"{self.project_name}-{self.stack_name}-cloudfront-error-rate",
            alarm_description="CloudFront 4xx/5xx error rate is high",
            metric_name="4xxErrorRate",
            namespace="AWS/CloudFront",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=5.0,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "DistributionId": self.cloudfront.id
            },
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        # WAF blocked requests alarm
        waf_blocked_alarm = aws.cloudwatch.MetricAlarm(
            "waf-blocked-requests",
            alarm_name=f"{self.project_name}-{self.stack_name}-waf-blocked-requests",
            alarm_description="WAF is blocking many requests",
            metric_name="BlockedRequests",
            namespace="AWS/WAFV2",
            statistic="Sum",
            period=300,
            evaluation_periods=2,
            threshold=100.0,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "WebACL": self.waf_resources["web_acl"].name,
                "Region": "CloudFront",
                "Rule": "ALL"
            },
            tags=self.common_tags,
            opts=ResourceOptions(provider=self.global_provider)
        )
        
        return {
            "error_rate": error_rate_alarm,
            "waf_blocked": waf_blocked_alarm
        }
    
    def _create_outputs(self) -> None:
        """Export important stack outputs."""
        pulumi.export("website_url", f"https://{self.domain_name}")
        pulumi.export("cloudfront_distribution_id", self.cloudfront.id)
        pulumi.export("cloudfront_domain_name", self.cloudfront.domain_name)
        pulumi.export("primary_s3_bucket", self.s3_buckets["primary"].id)
        pulumi.export("secondary_s3_bucket", self.s3_buckets["secondary"].id)
        pulumi.export("hosted_zone_id", self.route53_resources["hosted_zone"].zone_id)
        pulumi.export("name_