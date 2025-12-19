from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class StorageConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # S3 Bucket for Static Assets
        self.static_assets_bucket = S3Bucket(self, "static_assets_bucket",
            bucket=f"financial-static-assets-{environment_suffix}",
            force_destroy=True,  # Allow destroy for test environments
            tags={
                "Name": f"financial-static-assets-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Block public access for static assets (access through CloudFront only)
        S3BucketPublicAccessBlock(self, "static_assets_public_access_block",
            bucket=self.static_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Versioning for static assets
        S3BucketVersioningA(self, "static_assets_versioning",
            bucket=self.static_assets_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Encryption for static assets
        S3BucketServerSideEncryptionConfigurationA(self, "static_assets_encryption",
            bucket=self.static_assets_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )

        # S3 Bucket for Application Logs
        self.logs_bucket = S3Bucket(self, "logs_bucket",
            bucket=f"financial-logs-{environment_suffix}",
            force_destroy=True,  # Allow destroy for test environments
            tags={
                "Name": f"financial-logs-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Block all public access for logs
        S3BucketPublicAccessBlock(self, "logs_public_access_block",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Versioning for logs
        S3BucketVersioningA(self, "logs_versioning",
            bucket=self.logs_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Encryption for logs
        S3BucketServerSideEncryptionConfigurationA(self, "logs_encryption",
            bucket=self.logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )]
        )

        # Lifecycle policy for logs (90-day retention)
        S3BucketLifecycleConfiguration(self, "logs_lifecycle",
            bucket=self.logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-old-logs",
                    status="Enabled",
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )]
                )
            ]
        )
