import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class S3Stack:
    """S3 bucket for application logs with encryption and lifecycle rules."""
    
    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.bucket = self._create_logs_bucket()
        self.public_access_block = self._create_public_access_block()
        self.encryption_configuration = self._create_encryption_configuration()
        self.versioning_configuration = self._create_versioning_configuration()
        self.lifecycle_configuration = self._create_lifecycle_configuration()
    
    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for application logs with SSE-S3 encryption."""
        return aws.s3.Bucket(
            "logs-bucket",
            bucket=self.config.s3_bucket_name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_public_access_block(self) -> aws.s3.BucketPublicAccessBlock:
        """Create public access block for S3 bucket security."""
        return aws.s3.BucketPublicAccessBlock(
            "logs-bucket-pab",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_encryption_configuration(self) -> aws.s3.BucketServerSideEncryptionConfiguration:
        """Create server-side encryption configuration."""
        return aws.s3.BucketServerSideEncryptionConfiguration(
            "logs-bucket-encryption",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_versioning_configuration(self) -> aws.s3.BucketVersioning:
        """Create versioning configuration."""
        return aws.s3.BucketVersioning(
            "logs-bucket-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def _create_lifecycle_configuration(self) -> aws.s3.BucketLifecycleConfiguration:
        """Create lifecycle configuration to delete logs after 30 days."""
        return aws.s3.BucketLifecycleConfiguration(
            "logs-bucket-lifecycle",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="delete-logs-after-30-days",
                status="Enabled",
                expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=self.config.log_retention_days
                ),
                filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                    prefix="logs/"
                )
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )
    
    def get_bucket_name(self) -> pulumi.Output[str]:
        """Get bucket name."""
        return self.bucket.id
    
    def get_bucket_arn(self) -> pulumi.Output[str]:
        """Get bucket ARN."""
        return self.bucket.arn
