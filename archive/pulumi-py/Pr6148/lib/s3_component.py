import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
import hashlib


class S3Component(ComponentResource):
    """
    S3 buckets for static assets and logs with encryption
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        environment: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:storage:S3Component", name, None, opts)

        # Generate random suffix for bucket names
        random_suffix = hashlib.md5(environment_suffix.encode()).hexdigest()[:8]

        # Create static assets bucket
        self.static_bucket = aws.s3.Bucket(
            f"static-assets-{environment_suffix}",
            bucket=f"company-{environment}-static-{random_suffix}",
            tags={**tags, "Purpose": "static-assets", "Name": f"static-assets-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Enable versioning for static bucket
        self.static_versioning = aws.s3.BucketVersioningV2(
            f"static-versioning-{environment_suffix}",
            bucket=self.static_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self),
        )

        # Enable encryption for static bucket
        self.static_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"static-encryption-{environment_suffix}",
            bucket=self.static_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Block public access for static bucket
        self.static_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"static-public-access-block-{environment_suffix}",
            bucket=self.static_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Create logs bucket
        self.logs_bucket = aws.s3.Bucket(
            f"logs-{environment_suffix}",
            bucket=f"company-{environment}-logs-{random_suffix}",
            tags={**tags, "Purpose": "logs", "Name": f"logs-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Enable versioning for logs bucket
        self.logs_versioning = aws.s3.BucketVersioningV2(
            f"logs-versioning-{environment_suffix}",
            bucket=self.logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self),
        )

        # Enable encryption for logs bucket
        self.logs_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"logs-encryption-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Block public access for logs bucket
        self.logs_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"logs-public-access-block-{environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Lifecycle policy for logs bucket
        self.logs_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
            f"logs-lifecycle-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                        days=90,
                    ),
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Export properties
        self.static_assets_bucket = self.static_bucket.bucket
        self.logs_bucket_name = self.logs_bucket.bucket

        self.register_outputs(
            {
                "static_assets_bucket": self.static_assets_bucket,
                "logs_bucket": self.logs_bucket_name,
            }
        )
