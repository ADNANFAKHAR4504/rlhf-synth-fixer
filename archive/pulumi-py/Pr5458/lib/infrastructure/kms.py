"""
KMS module for encryption key management.

This module creates KMS keys for encrypting data at rest in S3.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class KMSStack:
    """
    Manages KMS keys for the serverless infrastructure.
    
    Creates KMS keys for S3 bucket encryption as required by the prompt.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize KMS Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.keys = {}
        
        # Create S3 encryption key
        self.s3_key = self._create_s3_key()
    
    def _create_s3_key(self) -> aws.kms.Key:
        """
        Create KMS key for S3 bucket encryption.
        
        Returns:
            KMS Key resource
        """
        key_name = self.config.get_resource_name("s3-key", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Key policy allowing S3 service to use the key
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow S3 to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }
        
        key = aws.kms.Key(
            "s3-encryption-key",
            description=f"KMS key for S3 bucket encryption - {self.config.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=pulumi.Output.json_dumps(key_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Create alias for easier reference
        aws.kms.Alias(
            "s3-key-alias",
            name=f"alias/{key_name}",
            target_key_id=key.id,
            opts=opts
        )
        
        self.keys['s3'] = key
        return key
    
    def get_s3_key_arn(self) -> Output[str]:
        """Get S3 KMS key ARN."""
        return self.s3_key.arn
    
    def get_s3_key_id(self) -> Output[str]:
        """Get S3 KMS key ID."""
        return self.s3_key.id

