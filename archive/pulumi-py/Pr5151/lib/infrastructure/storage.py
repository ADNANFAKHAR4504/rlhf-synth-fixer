"""
Storage infrastructure module.

This module creates S3 buckets with server-side encryption, versioning,
lifecycle policies, and access logging for secure and cost-effective storage.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class StorageStack:
    """
    Creates and manages S3 buckets with security and lifecycle configurations.
    
    Features:
    - Server-side encryption with AES-256
    - Versioning enabled
    - Lifecycle policies for cost optimization
    - Access logging
    - Public access blocking
    """
    
    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the storage stack.
        
        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Create main S3 bucket
        self.main_bucket = self._create_main_bucket()
        
        # Create logging bucket
        self.log_bucket = self._create_log_bucket()
        
        # Configure bucket encryption
        self.bucket_encryption = self._configure_bucket_encryption()
        
        # Configure bucket versioning
        self.bucket_versioning = self._configure_bucket_versioning()
        
        # Configure lifecycle rules
        self.lifecycle_configuration = self._configure_lifecycle()
        
        # Block public access
        self.public_access_block = self._block_public_access()
        
        # Configure logging
        self.logging_configuration = self._configure_logging()
    
    def _create_main_bucket(self) -> aws.s3.Bucket:
        """
        Create main S3 bucket.
        
        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_resource_name('bucket-main', include_region=True)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return bucket
    
    def _create_log_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for access logs.
        
        Returns:
            S3 Bucket resource for logs
        """
        bucket_name = self.config.get_resource_name('bucket-logs', include_region=True)
        
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name, Purpose='AccessLogs'),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return bucket
    
    def _configure_bucket_encryption(self) -> aws.s3.BucketServerSideEncryptionConfiguration:
        """
        Configure server-side encryption for main bucket.
        
        Uses AES-256 encryption algorithm.
        
        Returns:
            Bucket encryption configuration resource
        """
        encryption_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-encryption"
        
        encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            encryption_name,
            bucket=self.main_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm=self.config.s3_encryption_algorithm
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )
        
        return encryption
    
    def _configure_bucket_versioning(self) -> aws.s3.BucketVersioning:
        """
        Configure versioning for main bucket.
        
        Returns:
            Bucket versioning configuration resource
        """
        versioning_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-versioning"
        
        versioning = aws.s3.BucketVersioning(
            versioning_name,
            bucket=self.main_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled" if self.config.s3_enable_versioning else "Suspended"
            ),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )
        
        return versioning
    
    def _configure_lifecycle(self) -> aws.s3.BucketLifecycleConfiguration:
        """
        Configure lifecycle rules for cost optimization.
        
        Transitions objects to Infrequent Access and Glacier storage classes,
        and expires old objects.
        
        Returns:
            Bucket lifecycle configuration resource
        """
        lifecycle_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-lifecycle"
        
        lifecycle = aws.s3.BucketLifecycleConfiguration(
            lifecycle_name,
            bucket=self.main_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition-and-expiration",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_ia_days,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_glacier_days,
                            storage_class="GLACIER"
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )
        
        return lifecycle
    
    def _block_public_access(self) -> aws.s3.BucketPublicAccessBlock:
        """
        Block all public access to the main bucket.
        
        Returns:
            Bucket public access block resource
        """
        block_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-public-access-block"
        
        block = aws.s3.BucketPublicAccessBlock(
            block_name,
            bucket=self.main_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )
        
        return block
    
    def _configure_logging(self) -> aws.s3.BucketLogging:
        """
        Configure access logging for the main bucket.
        
        Returns:
            Bucket logging configuration resource
        """
        logging_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-logging"
        
        logging = aws.s3.BucketLogging(
            logging_name,
            bucket=self.main_bucket.id,
            target_bucket=self.log_bucket.id,
            target_prefix="access-logs/",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket, self.log_bucket]
            )
        )
        
        return logging
    
    def get_main_bucket_name(self) -> Output[str]:
        """Get main bucket name."""
        return self.main_bucket.id
    
    def get_main_bucket_arn(self) -> Output[str]:
        """Get main bucket ARN."""
        return self.main_bucket.arn
    
    def get_log_bucket_name(self) -> Output[str]:
        """Get log bucket name."""
        return self.log_bucket.id
    
    def get_log_bucket_arn(self) -> Output[str]:
        """Get log bucket ARN."""
        return self.log_bucket.arn

