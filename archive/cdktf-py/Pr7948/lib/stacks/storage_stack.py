"""Storage infrastructure - S3 buckets with cross-region replication"""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class StorageStack(Construct):
    """Creates S3 buckets with cross-region replication and RTC"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        is_primary: bool
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.is_primary = is_primary
        self.other_region = "us-east-2" if region == "us-east-1" else "us-east-1"

        # KMS key for S3 encryption
        self.kms_key = KmsKey(
            self,
            "s3-kms-key",
            description=f"KMS key for S3 encryption in {region}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"dr-s3-kms-{region}-{environment_suffix}"
            }
        )

        KmsAlias(
            self,
            "s3-kms-alias",
            name=f"alias/dr-s3-{region}-{environment_suffix}",
            target_key_id=self.kms_key.id
        )

        # S3 Bucket
        self.bucket = S3Bucket(
            self,
            "payment-data-bucket",
            bucket=f"dr-payment-data-{region}-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"dr-payment-data-{region}-{environment_suffix}"
            }
        )

        # Enable versioning (required for replication)
        self.bucket_versioning = S3BucketVersioningA(
            self,
            "bucket-versioning",
            bucket=self.bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Server-side encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "bucket-encryption",
            bucket=self.bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=(
                    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    )
                ),
                bucket_key_enabled=True
            )]
        )

        # Public access block
        S3BucketPublicAccessBlock(
            self,
            "bucket-public-access-block",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # NOTE: S3 Cross-Region Replication is configured in a separate
        # ReplicationStack that runs after both regional stacks deploy.
        # This ensures the destination bucket exists before replication is configured.
