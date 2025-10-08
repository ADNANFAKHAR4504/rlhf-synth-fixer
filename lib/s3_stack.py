"""
S3 Stack for CloudFront origin content storage.
"""

import pulumi
from pulumi_aws import s3
from pulumi import ResourceOptions
from typing import Optional


class S3Stack(pulumi.ComponentResource):
    """
    Creates an S3 bucket to serve as CloudFront origin for static content.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:s3:S3Stack', name, None, opts)

        # Create S3 bucket for origin content
        self.bucket = s3.BucketV2(
            f"origin-bucket-{environment_suffix}",
            bucket=f"tap-cdn-origin-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket versioning
        s3.BucketVersioningV2(
            f"origin-bucket-versioning-{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption
        s3.BucketServerSideEncryptionConfigurationV2(
            f"origin-bucket-encryption-{environment_suffix}",
            bucket=self.bucket.id,
            rules=[s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        s3.BucketPublicAccessBlock(
            f"origin-bucket-public-access-block-{environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create Origin Access Control policy for CloudFront
        self.bucket_name = self.bucket.id

        self.register_outputs({
            'bucket_name': self.bucket_name,
            'bucket': self.bucket
        })
