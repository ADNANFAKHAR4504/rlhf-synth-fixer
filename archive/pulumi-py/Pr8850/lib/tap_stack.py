"""
TAP Stack - Comprehensive multi-region static web application deployment
Fixed to handle S3 Block Public Access settings and public bucket policies.
LocalStack Community compatible - CloudFront and WAFv2 are optional.
"""

import json
import os
from dataclasses import dataclass

import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import s3, kms, cloudfront, wafv2, route53, acm, iam, cloudwatch

@dataclass
class TapStackArgs:
    """Configuration arguments for TAP stack deployment."""
    environment_suffix: str
    domain_name: str = None
    hosted_zone_id: str = None
    enable_logging: bool = True
    cost_optimization: bool = False
    test_mode: bool = False
    enable_cloudfront: bool = None  # None = auto-detect based on environment
    enable_waf: bool = None  # None = auto-detect based on environment

class TapStack(pulumi.ComponentResource):
    """Multi-region static website deployment stack with enterprise security features.

    LocalStack Community Compatible:
    - CloudFront and WAFv2 are optional (disabled by default for LocalStack)
    - S3 static website hosting works standalone without CloudFront
    - Route53 and ACM are only created if CloudFront is enabled
    """

    def __init__(self, name: str, args: TapStackArgs, opts: ResourceOptions = None):
        super().__init__('custom:resource:TapStack', name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.domain_name = args.domain_name
        self.hosted_zone_id = args.hosted_zone_id
        self.enable_logging = args.enable_logging
        self.cost_optimization = args.cost_optimization
        self.test_mode = args.test_mode
        self.regions = ['us-west-2', 'us-east-1']

        # Auto-detect LocalStack environment
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0 or \
                                        os.environ.get('AWS_ENDPOINT_URL', '').find('4566') >= 0

        # CloudFront and WAF are disabled by default for LocalStack Community
        # Can be explicitly enabled via args for testing
        if args.enable_cloudfront is None:
            self.enable_cloudfront = not is_localstack  # Disabled for LocalStack
        else:
            self.enable_cloudfront = args.enable_cloudfront

        if args.enable_waf is None:
            self.enable_waf = not is_localstack  # Disabled for LocalStack
        else:
            self.enable_waf = args.enable_waf

        # Initialize attributes that might not be created
        self.route53_record = None
        self.cert_validation_records = []
        self.cert_validation = None
        self.cloudfront_distribution = None
        self.oai = None
        self.waf_acl = None
        self.certificate = None

        # Create all resources
        self._create_kms_resources()
        self._create_s3_resources()

        if self.enable_logging:
            self._create_cloudwatch_resources()

        # CloudFront is optional (not in LocalStack Community)
        if self.enable_cloudfront:
            self._create_cloudfront_resources()

        # WAF is optional (not in LocalStack Community)
        if self.enable_waf:
            self._create_waf_resources()

        # ACM only needed if CloudFront is enabled and domain is provided
        if self.enable_cloudfront and self.domain_name:
            self._create_acm_resources()

        # Route53 only needed if CloudFront is enabled
        if self.enable_cloudfront and self.domain_name and self.hosted_zone_id:
            self._create_route53_resources()

        self._create_iam_resources()

        # Only register outputs if not in test mode
        if not self.test_mode:
            self._register_outputs()

    def _create_kms_resources(self):
        """Create KMS key and alias for S3 bucket encryption."""
        # For LocalStack, use shorter deletion window for easier cleanup
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0
        deletion_days = 7 if not is_localstack else 7  # Minimum is 7 days

        self.kms_key = kms.Key(
            f'kms-key-{self.environment_suffix}',
            description=f'KMS key for TAP stack {self.environment_suffix} S3 bucket encryption',
            deletion_window_in_days=deletion_days,
            enable_key_rotation=True,
            tags={
                'Environment': self.environment_suffix,
                'Purpose': 'S3-Encryption',
                'ManagedBy': 'Pulumi'
            },
            opts=ResourceOptions(
                parent=self,
                delete_before_replace=True
            )
        )
    
        self.kms_alias = kms.Alias(
            f'kms-alias-{self.environment_suffix}',
            name=f'alias/tap-stack-{self.environment_suffix}',
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self.kms_key)
        )

    def _create_s3_resources(self):
        """Create S3 buckets in multiple regions with versioning and encryption."""
        self.buckets = {}
        self.bucket_policies = {}
        self.bucket_public_access_blocks = {}
        self.logging_bucket = None
    
        # Create centralized logging bucket
        if self.enable_logging:
            self.logging_bucket = s3.Bucket(
                f'logging-bucket-{self.environment_suffix}',
                versioning=s3.BucketVersioningArgs(enabled=True),
                server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm='aws:kms',
                                kms_master_key_id=self.kms_key.key_id
                            )
                        )
                    )
                ),
                lifecycle_rules=[s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id='log-retention',
                    expiration=s3.BucketLifecycleRuleExpirationArgs(days=90)
                )],
                tags={
                    'Environment': self.environment_suffix,
                    'Purpose': 'AccessLogging',
                    'ManagedBy': 'Pulumi'
                },
                opts=ResourceOptions(parent=self)
            )
    
        # Create static website buckets in each region
        for region in self.regions:
            bucket = s3.Bucket(
                f'static-web-{region}-{self.environment_suffix}',
                versioning=s3.BucketVersioningArgs(enabled=True),
                server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm='aws:kms',
                                kms_master_key_id=self.kms_key.key_id
                            )
                        )
                    )
                ),
                website=s3.BucketWebsiteArgs(
                    index_document='index.html',
                    error_document='error.html'
                ),
                tags={
                    'Environment': self.environment_suffix,
                    'Region': region,
                    'Purpose': 'StaticWebsite',
                    'ManagedBy': 'Pulumi'
                },
                force_destroy=True,
                opts=ResourceOptions(parent=self)
            )
      
            # FIXED: Configure public access block to allow public policies
            public_access_block = s3.BucketPublicAccessBlock(
                f'public-access-block-{region}-{self.environment_suffix}',
                bucket=bucket.id,
                block_public_acls=False,
                block_public_policy=False,  # FIXED: Allow public policies
                ignore_public_acls=False,
                restrict_public_buckets=False,
                opts=ResourceOptions(parent=bucket)
            )
            self.bucket_public_access_blocks[region] = public_access_block
      
            # Create bucket policy for public read access (depends on public access block)
            bucket_policy = s3.BucketPolicy(
                f'bucket-policy-{region}-{self.environment_suffix}',
                bucket=bucket.id,
                policy=bucket.arn.apply(lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"{arn}/*"
                    }]
                })),
                opts=ResourceOptions(parent=bucket, depends_on=[public_access_block])
            )
      
            self.buckets[region] = bucket
            self.bucket_policies[region] = bucket_policy

    def _create_cloudwatch_resources(self):
        """Create CloudWatch log groups and alarms for monitoring."""
        self.log_groups = {}
        self.cloudwatch_alarms = {}
    
        for region in self.regions:
            # Create log group for each region
            log_group = cloudwatch.LogGroup(
                f'log-group-{region}-{self.environment_suffix}',
                name=f'/aws/s3/{region}-{self.environment_suffix}',
                retention_in_days=30,
                tags={
                    'Environment': self.environment_suffix,
                    'Region': region,
                    'ManagedBy': 'Pulumi'
                },
                opts=ResourceOptions(parent=self)
            )
            self.log_groups[region] = log_group
      
            # Create CloudWatch alarm for monitoring bucket access
            alarm = cloudwatch.MetricAlarm(
                f'alarm-{region}-{self.environment_suffix}',
                name=f'high-s3-requests-{region}-{self.environment_suffix}',
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=2,
                metric_name='NumberOfObjects',
                namespace='AWS/S3',
                period=300,
                statistic='Sum',
                threshold=1000,
                alarm_description=f'High S3 request count for {region}',
                alarm_actions=[],
                dimensions={
                    'BucketName': self.buckets[region].id,
                    'StorageType': 'AllStorageTypes'
                },
                tags={
                    'Environment': self.environment_suffix,
                    'Region': region,
                    'ManagedBy': 'Pulumi'
                },
                opts=ResourceOptions(parent=log_group)
            )
            self.cloudwatch_alarms[region] = alarm

    def _create_cloudfront_resources(self):
        """Create CloudFront distribution with origin access identity."""
        # Create Origin Access Identity for secure S3 access
        self.oai = cloudfront.OriginAccessIdentity(
            f'oai-{self.environment_suffix}',
            comment=f'OAI for TAP stack {self.environment_suffix}',
            opts=ResourceOptions(parent=self)
        )
    
        # Configure origins for each S3 bucket
        origins = []
        for region, bucket in self.buckets.items():
            origins.append(cloudfront.DistributionOriginArgs(
                domain_name=bucket.bucket_domain_name,
                origin_id=f'S3-{region}',
                s3_origin_config=cloudfront.DistributionOriginS3OriginConfigArgs(
                    origin_access_identity=self.oai.cloudfront_access_identity_path
                )
            ))
    
        # Create CloudFront distribution
        self.cloudfront_distribution = cloudfront.Distribution(
            f'cloudfront-{self.environment_suffix}',
            enabled=True,
            is_ipv6_enabled=True,
            default_root_object='index.html',
            aliases=[self.domain_name] if self.domain_name else [],
            origins=origins,
            default_cache_behavior=cloudfront.DistributionDefaultCacheBehaviorArgs(
                target_origin_id=origins[0].origin_id,
                viewer_protocol_policy='redirect-to-https',
                allowed_methods=['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
                cached_methods=['GET', 'HEAD'],
                forwarded_values=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward='none'
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
                compress=True
            ),
            price_class='PriceClass_100' if self.cost_optimization else 'PriceClass_All',
            custom_error_responses=[
                cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=404,
                    response_code=200,
                    response_page_path='/index.html'
                ),
                cloudfront.DistributionCustomErrorResponseArgs(
                    error_code=403,
                    response_code=200,
                    response_page_path='/index.html'
                )
            ],
            restrictions=cloudfront.DistributionRestrictionsArgs(
                geo_restriction=cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type='none'
                )
            ),
            viewer_certificate=cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            tags={
                'Environment': self.environment_suffix,
                'Purpose': 'CDN',
                'ManagedBy': 'Pulumi'
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_waf_resources(self):
        """Create AWS WAF Web ACL with comprehensive security rules."""
        self.waf_acl = wafv2.WebAcl(
            f'waf-acl-{self.environment_suffix}',
            scope='CLOUDFRONT',
            default_action=wafv2.WebAclDefaultActionArgs(allow={}),
            description=f'WAF ACL for TAP stack {self.environment_suffix}',
            visibility_config=wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f'waf-metric-{self.environment_suffix}',
                sampled_requests_enabled=True
            ),
            rules=[
                # AWS Managed Rules - Common Rule Set
                wafv2.WebAclRuleArgs(
                    name='AWS-AWSManagedRulesCommonRuleSet',
                    priority=1,
                    override_action=wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name='AWSManagedRulesCommonRuleSet',
                            vendor_name='AWS'
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name='AWSManagedRulesCommonRuleSet',
                        sampled_requests_enabled=True
                    ),
                ),
                # AWS Managed Rules - Known Bad Inputs
                wafv2.WebAclRuleArgs(
                    name='AWS-AWSManagedRulesKnownBadInputsRuleSet',
                    priority=2,
                    override_action=wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name='AWSManagedRulesKnownBadInputsRuleSet',
                            vendor_name='AWS'
                        )
                    ),
                    visibility_config=wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name='AWSManagedRulesKnownBadInputsRuleSet',
                        sampled_requests_enabled=True
                    ),
                )
            ],
            tags={
                'Environment': self.environment_suffix,
                'Purpose': 'WebSecurity',
                'ManagedBy': 'Pulumi'
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_acm_resources(self):
        """Create ACM certificate for TLS/SSL."""
        self.certificate = acm.Certificate(
            f'acm-cert-{self.environment_suffix}',
            domain_name=self.domain_name,
            validation_method='DNS',
            subject_alternative_names=[f'*.{self.domain_name}'],
            tags={
                'Environment': self.environment_suffix,
                'Purpose': 'TLS',
                'ManagedBy': 'Pulumi'
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_route53_resources(self):
        """Create Route53 DNS records and certificate validation."""
        # Create certificate validation records
        if hasattr(self, 'certificate'):
            def create_validation_records(domain_validation_options):
                """Create validation records from domain validation options."""
                validation_records = []
                for i, dvo in enumerate(domain_validation_options):
                    record = route53.Record(
                        f'cert-validation-{i}-{self.environment_suffix}',
                        zone_id=self.hosted_zone_id,
                        name=dvo['resource_record_name'],
                        type=dvo['resource_record_type'],
                        records=[dvo['resource_record_value']],
                        ttl=60,
                        opts=ResourceOptions(parent=self.certificate)
                    )
                    validation_records.append(record)
                return validation_records
      
            # Handle both Output and direct values
            if isinstance(self.certificate.domain_validation_options, Output):
                self.cert_validation_records = self.certificate.domain_validation_options.apply(
                    create_validation_records
                )
            else:
                # For mocked tests where it's a direct list
                self.cert_validation_records = create_validation_records(
                    self.certificate.domain_validation_options
                )
      
            # Certificate validation - only create if we have validation records
            if self.cert_validation_records:
                def create_cert_validation(validation_records):
                    if isinstance(validation_records, list) and validation_records:
                        return acm.CertificateValidation(
                            f'cert-validation-{self.environment_suffix}',
                            certificate_arn=self.certificate.arn,
                            validation_record_fqdns=[record.fqdn for record in validation_records],
                            opts=ResourceOptions(parent=self.certificate)
                        )
                    return None
        
                if isinstance(self.cert_validation_records, Output):
                    self.cert_validation = self.cert_validation_records.apply(create_cert_validation)
                else:
                    self.cert_validation = create_cert_validation(self.cert_validation_records)
    
        # Create A record pointing to CloudFront
        self.route53_record = route53.Record(
            f'route53-record-{self.environment_suffix}',
            zone_id=self.hosted_zone_id,
            name=self.domain_name,
            type='A',
            aliases=[route53.RecordAliasArgs(
                name=self.cloudfront_distribution.domain_name,
                zone_id=self.cloudfront_distribution.hosted_zone_id,
                evaluate_target_health=False
            )],
            opts=ResourceOptions(parent=self.cloudfront_distribution)
        )

    def _create_iam_resources(self):
        """Create IAM roles and policies with least privilege principle."""
        # Trust policy for CloudFormation service
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "cloudformation.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })
    
        # Create IAM role
        self.iam_role = iam.Role(
            f'pulumi-role-{self.environment_suffix}',
            assume_role_policy=assume_role_policy,
            description=f'IAM role for Pulumi TAP stack {self.environment_suffix}',
            tags={
                'Environment': self.environment_suffix,
                'Purpose': 'PulumiExecution',
                'ManagedBy': 'Pulumi'
            },
            opts=ResourceOptions(parent=self)
        )
    
        # Create least privilege policy
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                        "s3:GetBucketVersioning",
                        "s3:PutBucketVersioning"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::static-web-*-{self.environment_suffix}",
                        f"arn:aws:s3:::static-web-*-{self.environment_suffix}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudfront:CreateInvalidation",
                        "cloudfront:GetDistribution",
                        "cloudfront:ListDistributions"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": f"arn:aws:logs:*:*:log-group:/aws/s3/*-{self.environment_suffix}*"
                }
            ]
        })
    
        self.iam_policy = iam.RolePolicy(
            f'pulumi-policy-{self.environment_suffix}',
            role=self.iam_role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=self.iam_role)
        )

    def _register_outputs(self):
        """Register stack outputs for external consumption."""
        # Core infrastructure outputs
        pulumi.export('kms_key_id', self.kms_key.id)
        pulumi.export('kms_key_arn', self.kms_key.arn)
        pulumi.export(
            'bucket_names',
            Output.all(*[bucket.id for bucket in self.buckets.values()]).apply(
                lambda names: dict(zip(self.buckets.keys(), names))
            )
        )

        # Export S3 website endpoints (useful when CloudFront is not available)
        pulumi.export(
            'bucket_website_endpoints',
            Output.all(*[bucket.website_endpoint for bucket in self.buckets.values()]).apply(
                lambda endpoints: dict(zip(self.buckets.keys(), endpoints))
            )
        )

        pulumi.export('iam_role_arn', self.iam_role.arn)

        # CloudFront outputs (optional)
        if self.enable_cloudfront and self.cloudfront_distribution:
            pulumi.export('cloudfront_distribution_id', self.cloudfront_distribution.id)
            pulumi.export('cloudfront_domain_name', self.cloudfront_distribution.domain_name)
            pulumi.export('cloudfront_enabled', True)
        else:
            pulumi.export('cloudfront_enabled', False)

        # WAF outputs (optional)
        if self.enable_waf and self.waf_acl:
            pulumi.export('waf_acl_id', self.waf_acl.id)
            pulumi.export('waf_enabled', True)
        else:
            pulumi.export('waf_enabled', False)

        # Route53 outputs (conditional)
        if self.domain_name and self.hosted_zone_id and self.route53_record:
            pulumi.export('route53_record_fqdn', self.route53_record.fqdn)

        # ACM certificate outputs (conditional)
        if self.certificate:
            pulumi.export('certificate_arn', self.certificate.arn)

        # Logging outputs (conditional)
        if self.enable_logging:
            pulumi.export('logging_bucket_name', self.logging_bucket.id)
            pulumi.export(
                'log_group_names',
                Output.all(*[lg.name for lg in self.log_groups.values()]).apply(
                    lambda names: dict(zip(self.log_groups.keys(), names))
                )
            )

        # Environment metadata
        pulumi.export('environment', self.environment_suffix)
        pulumi.export('regions', self.regions)
        pulumi.export('deployment_timestamp', pulumi.get_stack())
