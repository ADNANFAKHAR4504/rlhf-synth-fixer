"""
S3 Component - Creates S3 bucket for static assets
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class S3Component(ComponentResource):
    """
    Reusable S3 component for static assets
    """

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:s3:S3Component", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create S3 bucket with unique name
        self.bucket = aws.s3.Bucket(
            f"static-assets-{environment}-{environment_suffix}",
            bucket=f"static-assets-{environment}-{environment_suffix}",
            tags={**tags, "Name": f"static-assets-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Enable versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            f"bucket-versioning-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=child_opts,
        )

        # Configure server-side encryption
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"bucket-encryption-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=child_opts,
        )

        # Block public access
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"bucket-public-access-block-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts,
        )

        # Register outputs
        self.bucket_name = self.bucket.bucket
        self.bucket_arn = self.bucket.arn

        self.register_outputs(
            {
                "bucket_name": self.bucket_name,
                "bucket_arn": self.bucket_arn,
            }
        )
