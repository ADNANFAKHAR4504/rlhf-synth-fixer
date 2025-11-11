"""
storage_stack.py

S3 storage infrastructure module.
Creates S3 buckets for migration checkpoints, rollback states, and backups.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class StorageStackArgs:
    """Arguments for StorageStack component."""

    def __init__(
        self,
        environment_suffix: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class StorageStack(pulumi.ComponentResource):
    """
    S3 storage infrastructure for migration project.

    Creates:
    - S3 bucket for migration checkpoints
    - S3 bucket for rollback states
    - S3 bucket for DMS replication logs
    - Bucket policies and lifecycle rules
    - Versioning and encryption configuration
    """

    def __init__(
        self,
        name: str,
        args: StorageStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Storage'
        }

        # Migration Checkpoints Bucket
        self.checkpoints_bucket = aws.s3.Bucket(
            f"migration-checkpoints-{self.environment_suffix}",
            bucket=f"migration-checkpoints-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="expire-old-versions",
                    enabled=True,
                    noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                        days=30
                    )
                ),
                aws.s3.BucketLifecycleRuleArgs(
                    id="transition-to-ia",
                    enabled=True,
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ],
            tags={
                **self.tags,
                'Name': f"migration-checkpoints-{self.environment_suffix}",
                'BucketType': 'Checkpoints'
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for checkpoints bucket
        aws.s3.BucketPublicAccessBlock(
            f"checkpoints-bucket-public-access-block-{self.environment_suffix}",
            bucket=self.checkpoints_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.checkpoints_bucket)
        )

        # Rollback States Bucket
        self.rollback_bucket = aws.s3.Bucket(
            f"migration-rollback-{self.environment_suffix}",
            bucket=f"migration-rollback-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="expire-old-versions",
                    enabled=True,
                    noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                        days=90
                    )
                )
            ],
            tags={
                **self.tags,
                'Name': f"migration-rollback-{self.environment_suffix}",
                'BucketType': 'Rollback'
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for rollback bucket
        aws.s3.BucketPublicAccessBlock(
            f"rollback-bucket-public-access-block-{self.environment_suffix}",
            bucket=self.rollback_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.rollback_bucket)
        )

        # DMS Logs Bucket
        self.dms_logs_bucket = aws.s3.Bucket(
            f"dms-logs-{self.environment_suffix}",
            bucket=f"dms-logs-{self.environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=False
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="expire-old-logs",
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=30
                    )
                )
            ],
            tags={
                **self.tags,
                'Name': f"dms-logs-{self.environment_suffix}",
                'BucketType': 'Logs'
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for DMS logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"dms-logs-bucket-public-access-block-{self.environment_suffix}",
            bucket=self.dms_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.dms_logs_bucket)
        )

        # Register outputs
        self.register_outputs({
            'checkpoints_bucket_name': self.checkpoints_bucket.bucket,
            'checkpoints_bucket_arn': self.checkpoints_bucket.arn,
            'rollback_bucket_name': self.rollback_bucket.bucket,
            'rollback_bucket_arn': self.rollback_bucket.arn,
            'dms_logs_bucket_name': self.dms_logs_bucket.bucket,
            'dms_logs_bucket_arn': self.dms_logs_bucket.arn
        })
