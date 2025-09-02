```python
import pulumi
import pulumi_aws as aws
from dataclasses import dataclass
from typing import Dict, Any, Optional
import json


@dataclass
class TapStackArgs:
    """Arguments for configuring the TapStack infrastructure."""
    tags: Dict[str, str]
    environment_suffix: str
    enable_logging: bool = True
    kms_deletion_window: int = 7
    cloudwatch_error_threshold: int = 10
    cloudwatch_evaluation_periods: int = 2


class TapStack(pulumi.ComponentResource):
    """
    Secure S3 infrastructure stack for production data storage with comprehensive
    security controls, encryption, logging, and monitoring capabilities.
    
    This stack implements PCI-DSS compliant infrastructure with:
    - Customer-managed KMS encryption
    - Comprehensive access controls
    - Server access logging
    - CloudWatch monitoring and alerting
    - Least-privilege IAM policies
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__("custom:infrastructure:TapStack", name, {}, opts)
        
        self.args = args
        self.tags = {**args.tags, "Environment": "Production"}
        self.environment_suffix = args.environment_suffix
        
        # Initialize resource references
        self.kms_key = None
        self.data_bucket = None
        self.logs_bucket = None
        self.bucket_policy = None
        self.cloudwatch_alarm = None
        
        # Create infrastructure components in proper dependency order
        self._create_kms_key()
        self._create_s3_buckets()
        self._create_iam_policies()
        self._create_cloudwatch_monitoring()
        
        # Register outputs for external consumption
        self.register_outputs({
            "data_bucket_name": self.data_bucket.bucket,
            "logs_bucket_name": self.logs_bucket.bucket,
            "kms_key_id": self.kms_key.key_id,
            "kms_key_arn": self.kms_key.arn,
        })

    def _create_kms_key(self) -> None:
        """
        Create a customer-managed KMS key for S3 bucket encryption.
        
        Implements:
        - Automatic key rotation for enhanced security
        - Appropriate deletion window to prevent accidental data loss
        - Proper tagging for cost tracking and resource management
        """
        # KMS key policy allowing root account access and S3 service usage
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {"AWS": pulumi.Output.concat("arn:aws:iam::", aws.get_caller_identity().account_id, ":root")},
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
        
        self.kms_key = aws.kms.Key(
            f"prod-data-kms-key-{self.environment_suffix}",
            description="Customer-managed KMS key for S3 bucket encryption in production environment",
            deletion_window_in_days=self.args.kms_deletion_window,
            enable_key_rotation=True,
            policy=pulumi.Output.json_dumps(key_policy),
            tags={
                **self.tags,
                "Name": f"prod-data-kms-key-{self.environment_suffix}",
                "Purpose": "S3 Encryption",
                "CostCenter": "DataStorage"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create KMS alias for easier key management
        aws.kms.Alias(
            f"prod-data-kms-alias-{self.environment_suffix}",
            name=f"alias/prod-data-key-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_s3_buckets(self) -> None:
        """
        Create S3 buckets for data storage and access logging.
        
        Implements:
        - Separate buckets for data and logs following security best practices
        - Comprehensive security controls blocking all public access
        - Appropriate encryption for each bucket type
        - Versioning for audit trails and data protection
        """
        # Create logs bucket first (required for data bucket logging)
        self._create_logs_bucket()
        
        # Create main data bucket with logging configuration
        self._create_data_bucket()

    def _create_logs_bucket(self) -> None:
        """
        Create S3 bucket for storing server access logs.
        
        Uses AES256 encryption as specified and configures appropriate
        permissions for S3 log delivery service.
        """
        self.logs_bucket = aws.s3.Bucket(
            f"prod-logs-{self.environment_suffix}",
            bucket=f"prod-logs-{self.environment_suffix}",
            tags={
                **self.tags,
                "Name": f"prod-logs-{self.environment_suffix}",
                "Purpose": "Access Logs Storage"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure versioning for logs bucket
        aws.s3.BucketVersioningV2(
            f"prod-logs-versioning-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure AES256 server-side encryption for logs bucket
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"prod-logs-encryption-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    )
                ]
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Block all public access to logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"prod-logs-public-access-block-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure bucket policy to allow S3 log delivery
        logs_bucket_policy = self.logs_bucket.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "S3ServerAccessLogsPolicy",
                    "Effect": "Allow",
                    "Principal": {"Service": "logging.s3.amazonaws.com"},
                    "Action": "s3:PutObject",
                    "Resource": f"{arn}/access-logs/*",
                    "Condition": {
                        "ArnEquals": {
                            "aws:SourceArn": f"arn:aws:s3:::prod-data-{self.environment_suffix}"
                        }
                    }
                }
            ]
        }))
        
        aws.s3.BucketPolicy(
            f"prod-logs-bucket-policy-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            policy=logs_bucket_policy,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_data_bucket(self) -> None:
        """
        Create the main S3 bucket for storing sensitive customer data.
        
        Implements comprehensive security controls including:
        - KMS encryption with customer-managed keys
        - Server access logging to separate bucket
        - Versioning for audit trails
        - Complete public access blocking
        """
        self.data_bucket = aws.s3.Bucket(
            f"prod-data-{self.environment_suffix}",
            bucket=f"prod-data-{self.environment_suffix}",
            tags={
                **self.tags,
                "Name": f"prod-data-{self.environment_suffix}",
                "Purpose": "Customer Data Storage",
                "DataClassification": "Sensitive"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure versioning for audit trails
        aws.s3.BucketVersioningV2(
            f"prod-data-versioning-{self.environment_suffix}",
            bucket=self.data_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure KMS encryption using customer-managed key
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"prod-data-encryption-{self.environment_suffix}",
            bucket=self.data_bucket.id,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationArgs(
                rules=[
                    aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2ServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn
                        ),
                        bucket_key_enabled=True
                    )
                ]
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Block all public access
        aws.s3.BucketPublicAccessBlock(
            f"prod-data-public-access-block-{self.environment_suffix}",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure server access logging if enabled
        if self.args.enable_logging:
            aws.s3.BucketLoggingV2(
                f"prod-data-logging-{self.environment_suffix}",
                bucket=self.data_bucket.id,
                target_bucket=self.logs_bucket.id,
                target_prefix="access-logs/",
                opts=pulumi.ResourceOptions(parent=self)
            )

    def _create_iam_policies(self) -> None:
        """
        Create restrictive IAM and bucket policies for data access control.
        
        Implements least-privilege access by:
        - Allowing access only to pre-existing DataAccessRole
        - Denying all other access attempts
        - Using explicit deny statements for enhanced security
        """
        # Get current AWS account ID for policy construction
        current = aws.get_caller_identity()
        
        # Create restrictive bucket policy allowing only DataAccessRole access
        bucket_policy_document = pulumi.Output.all(
            self.data_bucket.arn,
            current.account_id
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowDataAccessRole",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{args[1]}:role/DataAccessRole"
                    },
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Sid": "DenyAllOtherAccess",
                    "Effect": "Deny",
                    "NotPrincipal": {
                        "AWS": [
                            f"arn:aws:iam::{args[1]}:role/DataAccessRole",
                            f"arn:aws:iam::{args[1]}:root"
                        ]
                    },
                    "Action": "s3:*",
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Sid": "RequireSSLRequestsOnly",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }))
        
        self.bucket_policy = aws.s3.BucketPolicy(
            f"prod-data-bucket-policy-{self.environment_suffix}",
            bucket=self.data_bucket.id,
            policy=bucket_policy_document,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_cloudwatch_monitoring(self) -> None:
        """
        Create CloudWatch alarms for security monitoring and alerting.
        
        Monitors S3 access errors (4xx HTTP status codes) which may indicate:
        - Unauthorized access attempts
        - Misconfigured applications
        - Potential security incidents
        """
        # Create CloudWatch alarm for S3 4xx errors
        self.cloudwatch_alarm = aws.cloudwatch.MetricAlarm(
            f"prod-data-s3-errors-{self.environment_suffix}",
            alarm_name=f"prod-data-s3-4xx-errors-{self.environment_suffix}",
            alarm_description=f"Monitor 4xx errors on S3 bucket prod-data-{self.environment_suffix} for potential security issues",
            
            # Metric configuration
            metric_name="4xxErrors",
            namespace="AWS/S3",
            statistic="Sum",
            dimensions={
                "BucketName": self.data_bucket.bucket,
                "FilterId": "EntireBucket"
            },
            
            # Alarm thresholds and evaluation
            comparison_operator="GreaterThanThreshold",
            threshold=self.args.cloudwatch_error_threshold,
            evaluation_periods=self.args.cloudwatch_evaluation_periods,
            period=300,  # 5 minutes
            
            # Alarm behavior
            alarm_actions=[],  # Add SNS topic ARN here if notifications needed
            treat_missing_data="notBreaching",
            
            tags={
                **self.tags,
                "Name": f"prod-data-s3-errors-{self.environment_suffix}",
                "Purpose": "Security Monitoring",
                "AlertType": "S3 Access Errors"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create additional alarm for unusual access patterns (optional enhancement)
        aws.cloudwatch.MetricAlarm(
            f"prod-data-s3-requests-{self.environment_suffix}",
            alarm_name=f"prod-data-s3-high-requests-{self.environment_suffix}",
            alarm_description=f"Monitor unusually high request volume on S3 bucket prod-data-{self.environment_suffix}",
            
            metric_name="AllRequests",
            namespace="AWS/S3",
            statistic="Sum",
            dimensions={
                "BucketName": self.data_bucket.bucket,
                "FilterId": "EntireBucket"
            },
            
            comparison_operator="GreaterThanThreshold",
            threshold=1000,  # Adjust based on expected traffic
            evaluation_periods=2,
            period=300,
            
            alarm_actions=[],
            treat_missing_data="notBreaching",
            
            tags={
                **self.tags,
                "Name": f"prod-data-s3-requests-{self.environment_suffix}",
                "Purpose": "Anomaly Detection",
                "AlertType": "High Request Volume"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
```
