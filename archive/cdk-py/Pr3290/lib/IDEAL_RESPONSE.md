# IDEAL RESPONSE: CDK Python – Legal Documents Storage (S3 + Compliance)

This stack provisions a production-grade, compliance-focused storage system:

- S3 primary bucket with versioning and Object Lock (COMPLIANCE, ≥90 days)
- KMS CMK with rotation; bucket policy enforces the specific CMK on PUT
- S3 server access logging to a separate log bucket (S3-managed encryption)
- CloudTrail data events for S3 (read/write) + CloudWatch Logs
- CloudWatch alarms (4xx/5xx) and a dashboard (size, objects, errors)
- Least-privilege IAM ingestion role (explicit denies for delete/version delete)
- Request metrics enabled to ensure alarms fire

Code below is the full CDK Python implementation:

```python
from typing import Optional, Dict, Any
from dataclasses import dataclass
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Environment,
    aws_s3 as s3,
    aws_kms as kms,
    aws_cloudtrail as cloudtrail,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags
)

@dataclass
class TapStackProps:
    """Properties for the TapStack"""
    environment_suffix: str
    env: Optional[Environment] = None

class TapStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, env=props.env, **kwargs)

        # Get context parameters with defaults
        bucket_name: Optional[str] = self.node.try_get_context("bucketName")
        enable_object_lock: bool = self.node.try_get_context("enableObjectLock") or True
        retention_days: int = int(self.node.try_get_context("retentionDays") or 90)
        log_bucket_name: Optional[str] = self.node.try_get_context("logBucketName")
        alarm_email: Optional[str] = self.node.try_get_context("alarmEmail")
        
        # Add standard tags to all resources
        standard_tags = {
            'Owner': 'Abubakar',
            'System': 'LegalDocs',
            'Compliance': 'Yes',
            'Environment': self.node.try_get_context("environment") or 'Development'
        }
        
        # 1. Create KMS Key for encryption
        kms_key = self._create_kms_key(standard_tags)
        
        # 2. Create logging bucket first
        log_bucket = self._create_logging_bucket(log_bucket_name, kms_key, standard_tags)
        
        # 3. Create the primary bucket with versioning and Object Lock
        primary_bucket = self._create_primary_bucket(
            bucket_name, 
            enable_object_lock, 
            retention_days, 
            kms_key, 
            log_bucket,
            standard_tags
        )
        
        # 4. Set up CloudTrail for data events
        trail = self._create_cloudtrail(primary_bucket, log_bucket, standard_tags)
        
        # 5. Create CloudWatch metrics, alarms and dashboard
        alarm_topic = self._create_alarm_topic(alarm_email, standard_tags) if alarm_email else None
        self._create_alarms(primary_bucket, alarm_topic)
        self._create_dashboard(primary_bucket)
        
        # 6. Create IAM role for ingestion with least privilege
        ingestion_role = self._create_ingestion_role(primary_bucket, kms_key, standard_tags)
        
        # 7. Export outputs
        self._create_outputs(primary_bucket, log_bucket, kms_key, ingestion_role)
        
    def _create_kms_key(self, standard_tags: Dict[str, str]) -> kms.Key:
        """Create a KMS Customer Managed Key with rotation enabled"""
        key = kms.Key(
            self, 
            "LegalDocsKey",
            alias="alias/legal-docs-bucket",
            enable_key_rotation=True,
            description="KMS key for legal documents bucket encryption",
            removal_policy=RemovalPolicy.RETAIN,
        )
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(key).add(tag_key, tag_value)
            
        return key
        
    def _create_logging_bucket(self, log_bucket_name: Optional[str], kms_key: kms.Key, standard_tags: Dict[str, str]) -> s3.Bucket:
        """Create S3 bucket for access logs with appropriate security settings"""
        # FIX: Use S3-managed encryption for log bucket to avoid circular dependency
        log_bucket = s3.Bucket(
            self,
            "LogBucket",
            bucket_name=log_bucket_name,
            encryption=s3.BucketEncryption.S3_MANAGED,  # FIX: Changed from KMS to S3-managed
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="RetainLogVersions",
                    expiration=Duration.days(366),  # 1 year + 1 day
                    noncurrent_version_expiration=Duration.days(366),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(30)
                        )
                    ],
                )
            ]
        )
        
        # Add policy to deny unencrypted uploads (for S3-managed encryption)
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{log_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "AES256"  # FIX: Changed from aws:kms to AES256
                    }
                }
            )
        )
        
        # Require SSL
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    log_bucket.bucket_arn,
                    f"{log_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(log_bucket).add(tag_key, tag_value)
            
        return log_bucket
        
    def _create_primary_bucket(
        self, 
        bucket_name: Optional[str], 
        enable_object_lock: bool, 
        retention_days: int, 
        kms_key: kms.Key, 
        log_bucket: s3.Bucket,
        standard_tags: Dict[str, str]
    ) -> s3.Bucket:
        """Create primary bucket with versioning, encryption, and object lock"""
        bucket_props = {
            "bucket_name": bucket_name,
            "versioned": True,
            "block_public_access": s3.BlockPublicAccess.BLOCK_ALL,
            "encryption": s3.BucketEncryption.KMS,
            "encryption_key": kms_key,
            "enforce_ssl": True,
            "removal_policy": RemovalPolicy.RETAIN,
            "server_access_logs_bucket": log_bucket,
            "server_access_logs_prefix": "access-logs/",
        }
        
        # Add Object Lock if enabled
        if enable_object_lock:
            bucket_props["object_lock_enabled"] = True
            bucket_props["object_lock_default_retention"] = s3.ObjectLockRetention.compliance(
                Duration.days(retention_days)
            )
            
        # Create the primary bucket
        primary_bucket = s3.Bucket(
            self, 
            "LegalDocsBucket",
            **bucket_props
        )
        
        # FIX: Enable S3 Request Metrics for CloudWatch alarms
        cfn_bucket = primary_bucket.node.default_child
        cfn_bucket.metrics_configurations = [
            s3.CfnBucket.MetricsConfigurationProperty(id="EntireBucket")
        ]
        
        # Add lifecycle rules
        primary_bucket.add_lifecycle_rule(
            id="RetainVersionsForCompliance",
            expiration=Duration.days(3650),  # 10 years for current versions
            noncurrent_version_expiration=Duration.days(retention_days + 30),  # Keep noncurrent versions 30 days past minimum
            abort_incomplete_multipart_upload_after=Duration.days(7),
            # Optional storage transitions for cost savings
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=Duration.days(retention_days + 1)  # Only transition after retention period
                )
            ],
            noncurrent_version_transitions=[
                s3.NoncurrentVersionTransition(
                    storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                    transition_after=Duration.days(retention_days + 1)
                )
            ]
        )
        
        # Add bucket policies
        # 1. FIX: Deny unencrypted uploads AND enforce specific KMS key
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{primary_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms",
                        "s3:x-amz-server-side-encryption-aws-kms-key-id": kms_key.key_arn  # FIX: Added specific KMS key enforcement
                    }
                }
            )
        )
        
        # 2. Require SSL/TLS
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # 3. If Object Lock enabled, prevent bypassing Object Lock settings
        if enable_object_lock:
            primary_bucket.add_to_resource_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=[
                        "s3:BypassGovernanceRetention",
                        "s3:PutObjectRetention"
                    ],
                    resources=[f"{primary_bucket.bucket_arn}/*"]
                )
            )
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(primary_bucket).add(tag_key, tag_value)
            
        return primary_bucket
    
    def _create_cloudtrail(self, primary_bucket: s3.Bucket, log_bucket: s3.Bucket, standard_tags: Dict[str, str]) -> cloudtrail.Trail:
        """Create CloudTrail for data events on the primary bucket"""
        trail = cloudtrail.Trail(
            self,
            "LegalDocsTrail",
            bucket=log_bucket,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_YEAR,
            trail_name="legal-docs-trail",
            is_multi_region_trail=True,
        )
        
        # Add data events for the primary bucket
        trail.add_s3_event_selector(
            [cloudtrail.S3EventSelector(
                bucket=primary_bucket,
                object_prefix=""
            )],
            include_management_events=True,
            read_write_type=cloudtrail.ReadWriteType.ALL
        )
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(trail).add(tag_key, tag_value)
            
        return trail
    
    def _create_alarm_topic(self, alarm_email: str, standard_tags: Dict[str, str]) -> sns.Topic:
        """Create SNS topic for alarms and subscribe email"""
        topic = sns.Topic(
            self, 
            "LegalDocsAlarmTopic",
            display_name="Legal Documents Storage Alerts"
        )
        
        # Add email subscription
        topic.add_subscription(
            sns_subs.EmailSubscription(alarm_email)
        )
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(topic).add(tag_key, tag_value)
            
        return topic
    
    def _create_alarms(self, primary_bucket: s3.Bucket, alarm_topic: Optional[sns.Topic] = None) -> None:
        """Create CloudWatch alarms for S3 metrics"""
        alarms = []
        
        # 4XX errors alarm
        four_xx_alarm = cloudwatch.Alarm(
            self,
            "4XXErrorsAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="4xxErrors",
                dimensions_map={
                    "BucketName": primary_bucket.bucket_name,
                    "FilterId": "EntireBucket"  # FIX: Added FilterId for request metrics
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=10,  # Adjust threshold as needed
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if 4XX errors exceed threshold",
            alarm_name=f"{primary_bucket.bucket_name}-4xx-errors",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        alarms.append(four_xx_alarm)
        
        # 5XX errors alarm
        five_xx_alarm = cloudwatch.Alarm(
            self,
            "5XXErrorsAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="5xxErrors",
                dimensions_map={
                    "BucketName": primary_bucket.bucket_name,
                    "FilterId": "EntireBucket"  # FIX: Added FilterId for request metrics
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=5,  # Adjust threshold as needed
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alarm if 5XX errors exceed threshold",
            alarm_name=f"{primary_bucket.bucket_name}-5xx-errors",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        alarms.append(five_xx_alarm)
        
        # Add alarm actions if topic exists
        if alarm_topic:
            for alarm in alarms:
                alarm.add_alarm_action(cloudwatch_actions.SnsAction(alarm_topic))
    
    def _create_dashboard(self, primary_bucket: s3.Bucket) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring"""
        dashboard = cloudwatch.Dashboard(
            self,
            "LegalDocsDashboard",
            dashboard_name="LegalDocsStorageDashboard",
        )
        
        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Storage Bytes",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="BucketSizeBytes",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "StandardStorage",
                        },
                        statistic="Average",
                        period=Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Object Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="NumberOfObjects",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "StorageType": "AllStorageTypes",
                        },
                        statistic="Average",
                        period=Duration.days(1),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Error Rates",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="4xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "FilterId": "EntireBucket"  # FIX: Added FilterId for request metrics
                        },
                        statistic="Sum",
                        period=Duration.hours(1),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="5xxErrors",
                        dimensions_map={
                            "BucketName": primary_bucket.bucket_name,
                            "FilterId": "EntireBucket"  # FIX: Added FilterId for request metrics
                        },
                        statistic="Sum",
                        period=Duration.hours(1),
                    )
                ],
            )
        )
        
        return dashboard
    
    def _create_ingestion_role(self, primary_bucket: s3.Bucket, kms_key: kms.Key, standard_tags: Dict[str, str]) -> iam.Role:
        """Create IAM role with least privilege for document ingestion"""
        ingestion_role = iam.Role(
          self,
            "LegalDocsIngestionRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),  # Modify as needed for your use case
            description="Role for legal docs ingestion with least privilege"
        )
        
        # Grant read/write permissions to the bucket
        primary_bucket.grant_read_write(ingestion_role)
        
        # Allow specific S3 actions but deny version deletion
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                ],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # Explicitly deny delete permissions
        ingestion_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=[
                    "s3:DeleteObject",
                    "s3:DeleteObjectVersion",
                    "s3:BypassGovernanceRetention"
                ],
                resources=[f"{primary_bucket.bucket_arn}/*"]
            )
        )
        
        # Grant KMS key usage for encryption
        kms_key.grant_encrypt_decrypt(ingestion_role)
        
        # Apply standard tags
        for tag_key, tag_value in standard_tags.items():
            Tags.of(ingestion_role).add(tag_key, tag_value)
            
        return ingestion_role
    
    def _create_outputs(self, primary_bucket: s3.Bucket, log_bucket: s3.Bucket, kms_key: kms.Key, ingestion_role: iam.Role) -> None:
        """Create CloudFormation outputs for key resource information"""
        CfnOutput(
            self,
            "PrimaryBucketName",
            value=primary_bucket.bucket_name,
            description="Name of the primary bucket for legal documents",
        )
        
        CfnOutput(
            self,
            "LogBucketName",
            value=log_bucket.bucket_name,
            description="Name of the logging bucket",
        )
        
        CfnOutput(
            self,
            "KMSKeyArn",
            value=kms_key.key_arn,
            description="ARN of the KMS key used for encryption",
        )
        
        CfnOutput(
            self,
            "IngestionRoleArn",
            value=ingestion_role.role_arn,
            description="ARN of the ingestion role",
        )

```
