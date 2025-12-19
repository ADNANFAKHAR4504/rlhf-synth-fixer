"""
tap_stack.py - Enterprise-Grade Secure Static Website Hosting on AWS

This Pulumi script creates a comprehensive, HIPAA-compliant static website hosting
solution with multiple layers of security, monitoring, and operational controls.

Security Features:
- Encryption at rest and in transit
- WAF protection against OWASP Top 10
- DDoS protection via CloudFront Shield
- Comprehensive logging and monitoring
- Threat detection with GuardDuty
- Compliance monitoring with Config
- Least-privilege IAM policies
"""
```python
import pulumi
import pulumi_aws as aws
import json
from typing import Dict, List, Any

class SecureStaticWebsiteStack:
    def __init__(self):
        self.config = pulumi.Config()
        self.project_name = pulumi.get_project()
        self.stack_name = pulumi.get_stack()
        self.region = aws.get_region().name
        self.account_id = aws.get_caller_identity().account_id
        
        # Common tags for all resources
        self.common_tags = {
            "Project": self.project_name,
            "Stack": self.stack_name,
            "Environment": self.stack_name,
            "ManagedBy": "Pulumi",
            "SecurityLevel": "High",
            "ComplianceFramework": "HIPAA",
            "DataClassification": "Confidential"
        }
        
        # Initialize all components
        self._create_kms_keys()
        self._create_s3_bucket()
        self._create_cloudfront_distribution()
        self._create_waf()
        self._create_security_services()
        self._create_monitoring()
        self._create_compliance_resources()
        
        # Export important values
        self._create_exports()

    def _create_kms_keys(self):
        """Create KMS keys for encryption with automatic rotation"""
        
        # S3 encryption key
        self.s3_kms_key = aws.kms.Key(
            "s3-encryption-key",
            description=f"KMS key for S3 bucket encryption - {self.project_name}",
            enable_key_rotation=True,  # Constraint 1: Automatic key rotation
            deletion_window_in_days=30,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{self.account_id}:root"},
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
            }),
            tags=self.common_tags
        )
        
        self.s3_kms_key_alias = aws.kms.Alias(
            "s3-encryption-key-alias",
            name=f"alias/{self.project_name}-s3-encryption",
            target_key_id=self.s3_kms_key.key_id
        )
        
        # CloudTrail encryption key
        self.cloudtrail_kms_key = aws.kms.Key(
            "cloudtrail-encryption-key",
            description=f"KMS key for CloudTrail encryption - {self.project_name}",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{self.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudTrail Service",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey*"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=self.common_tags
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with comprehensive security configuration"""
        
        # Main website bucket
        self.website_bucket = aws.s3.Bucket(
            "website-bucket",
            bucket=f"{self.project_name}-website-{self.stack_name}-{self.region}",
            tags=self.common_tags
        )
        
        # Constraint 2: Block all public access
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            "website-bucket-pab",
            bucket=self.website_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Constraint 3: Enable versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            "website-bucket-versioning",
            bucket=self.website_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Constraint 4: Server-side encryption with KMS
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            "website-bucket-encryption",
            bucket=self.website_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.s3_kms_key.arn
                ),
                bucket_key_enabled=True
            )]
        )
        
        # Constraint 5: Lifecycle policy for cost optimization and compliance
        self.bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            "website-bucket-lifecycle",
            bucket=self.website_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="delete-old-versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=365
                    )
                )
            ]
        )
        
        # Constraint 6: Access logging
        self.access_logs_bucket = aws.s3.Bucket(
            "access-logs-bucket",
            bucket=f"{self.project_name}-access-logs-{self.stack_name}-{self.region}",
            tags=self.common_tags
        )
        
        # Block public access for logs bucket
        aws.s3.BucketPublicAccessBlock(
            "access-logs-bucket-pab",
            bucket=self.access_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Enable logging on main bucket
        self.bucket_logging = aws.s3.BucketLoggingV2(
            "website-bucket-logging",
            bucket=self.website_bucket.id,
            target_bucket=self.access_logs_bucket.id,
            target_prefix="access-logs/"
        )
        
        # CloudFront Origin Access Control
        self.oac = aws.cloudfront.OriginAccessControl(
            "website-oac",
            name=f"{self.project_name}-oac",
            description="OAC for secure S3 access",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4"
        )
        
        # Bucket policy for CloudFront access only
        self.bucket_policy = aws.s3.BucketPolicy(
            "website-bucket-policy",
            bucket=self.website_bucket.id,
            policy=pulumi.Output.all(
                self.website_bucket.arn,
                self.oac.id
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowCloudFrontServicePrincipal",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudfront.amazonaws.com"},
                        "Action": "s3:GetObject",
                        "Resource": f"{args[0]}/*",
                        "Condition": {
                            "StringEquals": {
                                "AWS:SourceArn": f"arn:aws:cloudfront::{self.account_id}:distribution/*"
                            }
                        }
                    }
                ]
            }))
        )

    def _create_waf(self):
        """Create WAF with comprehensive security rules"""
        
        # Constraint 7: WAF with OWASP Top 10 protection
        self.waf = aws.wafv2.WebAcl(
            "website-waf",
            name=f"{self.project_name}-waf",
            description="WAF for static website protection",
            scope="CLOUDFRONT",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                # AWS Managed Core Rule Set
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
                # Known Bad Inputs
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
                # SQL Injection Protection
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesSQLiRuleSet",
                    priority=3,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesSQLiRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="SQLiRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                aws.wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=4,
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
                metric_name=f"{self.project_name}WAFMetric",
                sampled_requests_enabled=True
            ),
            tags=self.common_tags
        )

    def _create_cloudfront_distribution(self):
        """Create CloudFront distribution with security headers and caching"""
        
        # SSL Certificate
        self.certificate = aws.acm.Certificate(
            "website-certificate",
            domain_name=self.config.get("domain_name") or f"{self.project_name}.example.com",
            validation_method="DNS",
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=aws.Provider("us-east-1", region="us-east-1"))
        )
        
        # Response Headers Policy for security headers
        self.response_headers_policy = aws.cloudfront.ResponseHeadersPolicy(
            "security-headers-policy",
            name=f"{self.project_name}-security-headers",
            security_headers_config=aws.cloudfront.ResponseHeadersPolicySecurityHeadersConfigArgs(
                # Constraint 8: Security headers
                strict_transport_security=aws.cloudfront.ResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityArgs(
                    access_control_max_age_sec=31536000,
                    include_subdomains=True
                ),
                content_type_options=aws.cloudfront.ResponseHeadersPolicySecurityHeadersConfigContentTypeOptionsArgs(
                    override=True
                ),
                frame_options=aws.cloudfront.ResponseHeadersPolicySecurityHeadersConfigFrameOptionsArgs(
                    frame_option="DENY",
                    override=True
                ),
                referrer_policy=aws.cloudfront.ResponseHeadersPolicySecurityHeadersConfigReferrerPolicyArgs(
                    referrer_policy="strict-origin-when-cross-origin",
                    override=True
                )
            )
        )
        
        # Cache Policy
        self.cache_policy = aws.cloudfront.CachePolicy(
            "website-cache-policy",
            name=f"{self.project_name}-cache-policy",
            comment="Cache policy for static website",
            default_ttl=86400,
            max_ttl=31536000,
            min_ttl=0,
            parameters_in_cache_key_and_forwarded_to_origin=aws.cloudfront.CachePolicyParametersInCacheKeyAndForwardedToOriginArgs(
                enable_accept_encoding_brotli=True,
                enable_accept_encoding_gzip=True,
                query_strings_config=aws.cloudfront.CachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigArgs(
                    query_string_behavior="none"
                ),
                headers_config=aws.cloudfront.CachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigArgs(
                    header_behavior="none"
                ),
                cookies_config=aws.cloudfront.CachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigArgs(
                    cookie_behavior="none"
                )
            )
        )
        
        # CloudFront Distribution
        self.distribution = aws.cloudfront.Distribution(
            "website-distribution",
            aliases=[self.config.get("domain_name")] if self.config.get("domain_name") else [],
            origins=[aws.cloudfront.DistributionOriginArgs(
                domain_name=self.website_bucket.bucket_domain_name,
                origin_id="S3Origin",
                origin_access_control_id=self.oac.id,
                s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                    origin_access_identity=""  # Empty for OAC
                )
            )],
            enabled=True,
            is_ipv6_enabled=True,
            default_root_object="index.html",
            # Constraint 9: Custom error pages
            custom_error_responses=[
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=404,
                    response_page_path="/404.html",
                    error_caching_min_ttl=300
                ),
                aws.cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=403,
                    response_code=404,
                    response_page_path="/404.html",
                    error_caching_min_ttl=300
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id="S3Origin",
                cache_policy_id=self.cache_policy.id,
                response_headers_policy_id=self.response_headers_policy.id,
                viewer_protocol_policy="redirect-to-https",  # Constraint 10: HTTPS only
                compress=True
            ),
            # Constraint 11: Geographic restrictions (example)
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                acm_certificate_arn=self.certificate.arn,
                ssl_support_method="sni-only",
                minimum_protocol_version="TLSv1.2_2021"
            ),
            # Constraint 12: Access logging
            logging_config=aws.cloudfront.DistributionLoggingConfigArgs(
                bucket=self.access_logs_bucket.bucket_domain_name,
                prefix="cloudfront-logs/",
                include_cookies=False
            ),
            web_acl_id=self.waf.arn,
            tags=self.common_tags
        )

    def _create_security_services(self):
        """Enable AWS security services"""
        
        # Constraint 13: Enable GuardDuty
        self.guardduty_detector = aws.guardduty.Detector(
            "guardduty-detector",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            datasources=aws.guardduty.DetectorDatasourcesArgs(
                s3_logs=aws.guardduty.DetectorDatasourcesS3LogsArgs(enable=True),
                kubernetes=aws.guardduty.DetectorDatasourcesKubernetesArgs(
                    audit_logs=aws.guardduty.DetectorDatasourcesKubernetesAuditLogsArgs(enable=True)
                ),
                malware_protection=aws.guardduty.DetectorDatasourcesMalwareProtectionArgs(
                    scan_ec2_instance_with_findings=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsArgs(
                        ebs_volumes=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsEbsVolumesArgs(
                            enable=True
                        )
                    )
                )
            ),
            tags=self.common_tags
        )
        
        # Constraint 14: Enable Security Hub
        self.security_hub = aws.securityhub.Account(
            "security-hub",
            enable_default_standards=True,
            control_finding_generator="SECURITY_CONTROL",
            auto_enable_controls=True
        )
        
        # Enable AWS Config for compliance monitoring
        # Constraint 15: Config service role
        self.config_role = aws.iam.Role(
            "config-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"}
                }]
            }),
            managed_policy_arns=["arn:aws:iam::aws:policy/service-role/ConfigRole"],
            tags=self.common_tags
        )
        
        # Config delivery channel bucket
        self.config_bucket = aws.s3.Bucket(
            "config-bucket",
            bucket=f"{self.project_name}-config-{self.stack_name}-{self.region}",
            tags=self.common_tags
        )
        
        # Config bucket policy
        aws.s3.BucketPolicy(
            "config-bucket-policy",
            bucket=self.config_bucket.id,
            policy=pulumi.Output.all(
                self.config_bucket.arn,
                self.account_id
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSConfigBucketPermissionsCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": args[0],
                        "Condition": {
                            "StringEquals": {"AWS:SourceAccount": args[1]}
                        }
                    },
                    {
                        "Sid": "AWSConfigBucketExistenceCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:ListBucket",
                        "Resource": args[0],
                        "Condition": {
                            "StringEquals": {"AWS:SourceAccount": args[1]}
                        }
                    },
                    {
                        "Sid": "AWSConfigBucketDelivery",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"{args[0]}/AWSLogs/{args[1]}/Config/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control",
                                "AWS:SourceAccount": args[1]
                            }
                        }
                    }
                ]
            }))
        )
        
        # Config configuration recorder
        self.config_recorder = aws.cfg.ConfigurationRecorder(
            "config-recorder",
            name=f"{self.project_name}-recorder",
            role_arn=self.config_role.arn,
            recording_group=aws.cfg.ConfigurationRecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True
            )
        )
        
        # Config delivery channel
        self.config_delivery_channel = aws.cfg.DeliveryChannel(
            "config-delivery-channel",
            name=f"{self.project_name}-delivery-channel",
            s3_bucket_name=self.config_bucket.bucket
        )

    def _create_monitoring(self):
        """Create comprehensive monitoring and alerting"""
        
        # CloudTrail for audit logging - Constraint 16
        self.cloudtrail_bucket = aws.s3.Bucket(
            "cloudtrail-bucket",
            bucket=f"{self.project_name}-cloudtrail-{self.stack_name}-{self.region}",
            tags=self.common_tags
        )
        
        # CloudTrail bucket policy
        aws.s3.BucketPolicy(
            "cloudtrail-bucket-policy",
            bucket=self.cloudtrail_bucket.id,
            policy=pulumi.Output.all(
                self.cloudtrail_bucket.arn,
                self.account_id
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": args[0],
                        "Condition": {
                            "StringEquals": {"AWS:SourceArn": f"arn:aws:cloudtrail:{self.region}:{args[1]}:trail/{self.project_name}-trail"}
                        }
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"{args[0]}/AWSLogs/{args[1]}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control",
                                "AWS:SourceArn": f"arn:aws:cloudtrail:{self.region}:{args[1]}:trail/{self.project_name}-trail"
                            }
                        }
                    }
                ]
            }))
        )
        
        # CloudTrail
        self.cloudtrail = aws.cloudtrail.Trail(
            "audit-trail",
            name=f"{self.project_name}-trail",
            s3_bucket_name=self.cloudtrail_bucket.bucket,
            s3_key_prefix="AWSLogs",
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            kms_key_id=self.cloudtrail_kms_key.arn,
            event_selectors=[
                aws.cloudtrail.TrailEventSelectorArgs(
                    read_write_type="All",
                    include_management_events=True,
                    data_resources=[
                        aws.cloudtrail.TrailEventSelectorDataResourceArgs(
                            type="AWS::S3::Object",
                            values=[f"{self.website_bucket.arn}/*"]
                        ),
                        aws.cloudtrail.TrailEventSelectorDataResourceArgs(
                            type="AWS::S3::Bucket",
                            values=[self.website_bucket.arn]
                        )
                    ]
                )
            ],
            tags=self.common_tags
        )
        
        # SNS topic for alerts - Constraint 17
        self.alert_topic = aws.sns.Topic(
            "security-alerts",
            name=f"{self.project_name}-security-alerts",
            kms_master_key_id=self.s3_kms_key.id,
            tags=self.common_tags
        )
        
        # CloudWatch alarms for security monitoring - Constraint 18
        # Unauthorized API calls alarm
        self.unauthorized_api_calls_alarm = aws.cloudwatch.MetricAlarm(
            "unauthorized-api-calls",
            alarm_name=f"{self.project_name}-unauthorized-api-calls",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnauthorizedAPICalls",
            namespace="CloudWatchLogMetrics",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Monitors for unauthorized API calls",
            alarm_actions=[self.alert_topic.arn],
            tags=self.common_tags
        )
        
        # Root account usage alarm
        self.root_usage_alarm = aws.cloudwatch.MetricAlarm(
            "root-account-usage",
            alarm_name=f"{self.project_name}-root-account-usage",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="RootAccountUsage",
            namespace="CloudWatchLogMetrics",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Monitors for root account usage",
            alarm_actions=[self.alert_topic.arn],
            tags=self.common_tags
        )
        
        # WAF blocked requests alarm
        self.waf_blocked_requests_alarm = aws.cloudwatch.MetricAlarm(
            "waf-blocked-requests",
            alarm_name=f"{self.project_name}-waf-blocked-requests",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="BlockedRequests",
            namespace="AWS/WAFV2",
            period=300,
            statistic="Sum",
            threshold=100,
            alarm_description="Monitors for high number of WAF blocked requests",
            alarm_actions=[self.alert_topic.arn],
            dimensions={"WebACL": self.waf.name, "Region": "CloudFront", "Rule":
```
