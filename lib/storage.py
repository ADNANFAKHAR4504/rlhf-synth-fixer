"""
Storage infrastructure module.
Creates S3 buckets with encryption.
"""
from typing import Any, Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class StorageStack:
    """Creates S3 buckets for data and logs."""

    def __init__(self,
                 name: str,
                 data_bucket_name: Optional[str],
                 logs_bucket_name: Optional[str],
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize storage infrastructure.

        Args:
            name: Resource name prefix
            data_bucket_name: Data bucket name (optional)
            logs_bucket_name: Logs bucket name (optional)
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # Data bucket
        data_bucket_final_name = data_bucket_name or f"financial-data-{environment_suffix}"
        self.data_bucket = aws.s3.Bucket(
            f"data-bucket-{environment_suffix}",
            bucket=data_bucket_final_name,
            tags={**tags, "Name": f"data-bucket-{environment_suffix}"},
            opts=opts
        )

        # Enable versioning on data bucket
        self.data_bucket_versioning = aws.s3.BucketVersioning(
            f"data-bucket-versioning-{environment_suffix}",
            bucket=self.data_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Enable encryption on data bucket
        default_encryption_config = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
        )
        encryption_rule = aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=default_encryption_config
        )
        self.data_bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"data-bucket-encryption-{environment_suffix}",
            bucket=self.data_bucket.id,
            rules=[encryption_rule],
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Block public access
        self.data_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"data-bucket-public-access-{environment_suffix}",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Logs bucket
        logs_bucket_final_name = logs_bucket_name or f"financial-logs-{environment_suffix}"
        self.logs_bucket = aws.s3.Bucket(
            f"logs-bucket-{environment_suffix}",
            bucket=logs_bucket_final_name,
            tags={**tags, "Name": f"logs-bucket-{environment_suffix}"},
            opts=opts
        )

        # Enable encryption on logs bucket
        logs_default_encryption_config = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
        )
        logs_encryption_rule = aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=logs_default_encryption_config
        )
        self.logs_bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"logs-bucket-encryption-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[logs_encryption_rule],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Block public access on logs bucket
        self.logs_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"logs-bucket-public-access-{environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.logs_bucket)
        )
