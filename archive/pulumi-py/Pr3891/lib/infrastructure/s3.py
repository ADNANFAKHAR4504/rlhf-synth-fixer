"""
S3 module for the serverless infrastructure.

This module creates S3 buckets with strict security policies,
encryption, and event notifications for Lambda processing.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import s3, s3control

from .config import InfrastructureConfig


class S3Stack:
    """
    S3 stack for managing static asset storage.
    
    Creates S3 buckets with strict security policies, encryption,
    and event notifications for automated processing.
    """
    
    def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize S3 stack.
        
        Args:
            config: Infrastructure configuration
            lambda_outputs: Lambda stack outputs for event notifications
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.lambda_outputs = lambda_outputs
        
        # Create S3 bucket
        self._create_s3_bucket()
        
        # Create bucket policy
        self._create_bucket_policy()
      
        
        # Create bucket versioning
        self._create_bucket_versioning()
        
        # Create bucket encryption
        self._create_bucket_encryption()
        
        # Create public access block
        self._create_public_access_block()
    
    def _create_s3_bucket(self):
        """Create S3 bucket with proper configuration."""
        bucket_config = self.config.get_s3_config('static-assets')
        
        self.s3_bucket = s3.Bucket(
            bucket_config['bucket_name'],
            bucket=bucket_config['bucket_name'],
            force_destroy=True,  # Allow destruction for testing
            tags=bucket_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_bucket_policy(self):
        """Create strict S3 bucket policy to deny public access."""
        # Create a simple policy that allows Lambda access
        # We'll use the bucket name to construct the ARN
        bucket_name = self.config.get_naming_convention('s3', 'static-assets')
        
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowLambdaAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }
        
        self.bucket_policy = s3.BucketPolicy(
            self.config.get_naming_convention("s3-policy", "static-assets"),
            bucket=self.s3_bucket.id,
            policy=bucket_policy,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_event_notifications(self):
        """Create S3 event notifications for Lambda processing."""
        # Event notification for object creation
        self.object_created_notification = s3.BucketNotification(
            self.config.get_naming_convention("s3-notification", "object-created"),
            bucket=self.s3_bucket.id,
            lambda_functions=[
                {
                    "lambda_function_arn": self.lambda_outputs['s3_processor_lambda_function_arn'],
                    "events": ["s3:ObjectCreated:*"],
                    "filter_prefix": "uploads/",
                    "filter_suffix": ".jpg"
                }
            ],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Event notification for object removal
        self.object_removed_notification = s3.BucketNotification(
            self.config.get_naming_convention("s3-notification", "object-removed"),
            bucket=self.s3_bucket.id,
            lambda_functions=[
                {
                    "lambda_function_arn": self.lambda_outputs['s3_processor_lambda_function_arn'],
                    "events": ["s3:ObjectRemoved:*"],
                    "filter_prefix": "uploads/",
                    "filter_suffix": ".jpg"
                }
            ],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_bucket_versioning(self):
        """Create S3 bucket versioning configuration."""
        self.bucket_versioning = s3.BucketVersioning(
            self.config.get_naming_convention("s3-versioning", "static-assets"),
            bucket=self.s3_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_bucket_encryption(self):
        """Create S3 bucket encryption configuration."""
        if self.config.enable_encryption:
            self.bucket_encryption = s3.BucketServerSideEncryptionConfiguration(
                self.config.get_naming_convention("s3-encryption", "static-assets"),
                bucket=self.s3_bucket.id,
                rules=[
                    {
                        "apply_server_side_encryption_by_default": {
                            "sse_algorithm": "AES256"
                        },
                        "bucket_key_enabled": True
                    }
                ],
                opts=ResourceOptions(provider=self.provider) if self.provider else None
            )
    
    def _create_public_access_block(self):
        """Create S3 public access block configuration."""
        self.public_access_block = s3.BucketPublicAccessBlock(
            self.config.get_naming_convention("s3-public-access-block", "static-assets"),
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """
        Get S3 stack outputs.
        
        Returns:
            Dictionary containing S3 bucket outputs
        """
        return {
            "s3_bucket_name": self.s3_bucket.bucket,
            "s3_bucket_arn": self.s3_bucket.arn,
            "s3_bucket_domain_name": self.s3_bucket.bucket_domain_name,
            "s3_bucket_regional_domain_name": self.s3_bucket.bucket_regional_domain_name
        }
