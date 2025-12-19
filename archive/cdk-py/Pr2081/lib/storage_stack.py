"""storage_stack.py
S3 storage configuration with access logging and encryption.
"""

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from constructs import Construct


class StorageStack(cdk.NestedStack):
    """Creates S3 buckets with proper security and logging configuration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Access logs bucket
        self.access_logs_bucket = s3.Bucket(
            self, f"prod-access-logs-{environment_suffix}",
            bucket_name=f"prod-access-logs-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}-{cdk.Aws.REGION}-primary-4",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldAccessLogs",
                    expiration=cdk.Duration.days(90),
                    enabled=True
                )
            ]
        )

        # Main application bucket
        self.app_bucket = s3.Bucket(
            self, f"prod-app-bucket-{environment_suffix}",
            bucket_name=f"prod-app-bucket-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}-{cdk.Aws.REGION}-primary-4",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            server_access_logs_bucket=self.access_logs_bucket,
            server_access_logs_prefix="access-logs/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(90)
                        )
                    ],
                    enabled=True
                )
            ]
        )

        # Backup bucket for database backups
        self.backup_bucket = s3.Bucket(
            self, f"prod-backup-bucket-{environment_suffix}",
            bucket_name=f"prod-backup-bucket-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}-{cdk.Aws.REGION}-primary-4",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="BackupRetention",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=cdk.Duration.days(365)
                        )
                    ],
                    enabled=True
                )
            ]
        )

        # Outputs
        cdk.CfnOutput(
            self, "AppBucketName",
            value=self.app_bucket.bucket_name,
            description="Main application S3 bucket name"
        )

        cdk.CfnOutput(
            self, "BackupBucketName",
            value=self.backup_bucket.bucket_name,
            description="Backup S3 bucket name"
        )
