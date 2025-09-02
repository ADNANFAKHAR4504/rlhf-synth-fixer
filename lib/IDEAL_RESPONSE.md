"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
creating a secure and compliant S3 bucket suitable for production use.

It implements a comprehensive S3 bucket deployment with KMS encryption,
IAM policies, CloudWatch monitoring, and PCI-DSS compliance features.
"""

```python
from typing import Optional, Dict, Any
import json

import pulumi
from pulumi import ResourceOptions, get_stack
from pulumi_aws import s3, kms, iam, cloudwatch, config


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment 
            environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        enable_server_access_logs (Optional[bool]): Whether to enable server access logging.
        bucket_name_suffix (Optional[str]): Custom suffix for the S3 bucket name.
    """

    def __init__(
        self, 
        environment_suffix: Optional[str] = None, 
        tags: Optional[dict] = None,
        enable_server_access_logs: Optional[bool] = True,
        bucket_name_suffix: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix if environment_suffix is not None else 'prod'
        self.tags = tags or {}
        self.enable_server_access_logs = enable_server_access_logs if enable_server_access_logs is not None else True
        self.bucket_name_suffix = bucket_name_suffix or 'data'


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for creating a secure S3 bucket.

    This component creates a production-ready S3 bucket with:
    - KMS encryption at rest
    - IAM policy restricting access to DataAccessRole
    - CloudWatch monitoring and alarms
    - PCI-DSS compliance features
    - Proper logging and versioning
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
        self.enable_server_access_logs = args.enable_server_access_logs
        self.bucket_name_suffix = args.bucket_name_suffix

        # Set AWS region
        config.region = "us-east-1"

        # Base tags for all resources
        base_tags = {
            "Environment": "Production",
            "Project": "TAP",
            "ManagedBy": "Pulumi"
        }
        base_tags.update(self.tags)

        # Create KMS key for encryption
        kms_key = kms.Key(
            f"tap-encryption-key-{self.environment_suffix}",
            description="KMS key for S3 bucket encryption",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags=base_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create KMS alias
        kms_alias = kms.Alias(
            f"tap-encryption-alias-{self.environment_suffix}",
            name=f"alias/tap-encryption-{self.environment_suffix}",
            target_key_id=kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

        # Create logs bucket first (for server access logging)
        logs_bucket = s3.Bucket(
            f"prod-logs-{self.environment_suffix}",
            acl="log-delivery-write",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ),
            tags=base_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create public access block for logs bucket
        logs_bucket_public_access_block = s3.BucketPublicAccessBlock(
            f"tap-logs-bucket-public-access-block-{self.environment_suffix}",
            bucket=logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create main data bucket
        data_bucket = s3.Bucket(
            f"prod-{self.bucket_name_suffix}-{self.environment_suffix}",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            kms_master_key_id=kms_key.arn,
                            sse_algorithm="aws:kms"
                        )
                    )
                )
            ),
            logging=s3.BucketLoggingArgs(
                target_bucket=logs_bucket.id,
                target_prefix=f"logs/{self.environment_suffix}/"
            ) if self.enable_server_access_logs else None,
            tags=base_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create public access block for data bucket
        data_bucket_public_access_block = s3.BucketPublicAccessBlock(
            f"tap-data-bucket-public-access-block-{self.environment_suffix}",
            bucket=data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM policy for bucket access
        bucket_policy = iam.Policy(
            f"tap-bucket-policy-{self.environment_suffix}",
            description="IAM policy for S3 bucket access",
            policy=data_bucket.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowDataAccessRoleAccess",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": f"arn:aws:iam::{config.account_id}:role/DataAccessRole"
                            },
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            "Resource": [
                                arn,
                                f"{arn}/*"
                            ]
                        },
                        {
                            "Sid": "DenyAllOtherAccess",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                arn,
                                f"{arn}/*"
                            ],
                            "Condition": {
                                "StringNotEquals": {
                                    "aws:PrincipalArn": f"arn:aws:iam::{config.account_id}:role/DataAccessRole"
                                }
                            }
                        }
                    ]
                })
            ),
            tags=base_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to bucket
        bucket_policy_attachment = s3.BucketPolicy(
            f"tap-bucket-policy-attachment-{self.environment_suffix}",
            bucket=data_bucket.id,
            policy=bucket_policy.policy,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarm for access errors
        access_error_alarm = cloudwatch.MetricAlarm(
            f"tap-access-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4xxError",
            namespace="AWS/S3",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="S3 bucket access error threshold exceeded",
            dimensions={
                "BucketName": data_bucket.bucket,
                "FilterId": "EntireBucket"
            },
            tags=base_tags,
            opts=ResourceOptions(parent=self)
        )

        # Store references to created resources
        self.kms_key = kms_key
        self.kms_alias = kms_alias
        self.logs_bucket = logs_bucket
        self.data_bucket = data_bucket
        self.bucket_policy = bucket_policy
        self.access_error_alarm = access_error_alarm

        # Register outputs
        self.register_outputs({
            "kms_key_arn": kms_key.arn,
            "kms_key_id": kms_key.key_id,
            "logs_bucket_name": logs_bucket.bucket,
            "data_bucket_name": data_bucket.bucket,
            "data_bucket_arn": data_bucket.arn,
            "bucket_policy_id": bucket_policy.id,
            "access_error_alarm_arn": access_error_alarm.arn
        })
```
