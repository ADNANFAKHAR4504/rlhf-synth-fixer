"""
S3 storage module for environment migration solution.

This module manages S3 buckets for deployment assets, with versioning,
replication, and lifecycle policies.
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class StorageStack:
    """
    Manages S3 buckets for deployment assets and logs.
    
    Creates buckets with versioning, encryption, lifecycle policies,
    and cross-region replication.
    """
    
    def __init__(self, config: MigrationConfig, provider_manager: AWSProviderManager):
        """
        Initialize storage stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.deployment_buckets: Dict[str, aws.s3.Bucket] = {}
        self.log_buckets: Dict[str, aws.s3.Bucket] = {}
        self.replication_role: Optional[aws.iam.Role] = None
        
        # Create buckets for all regions
        self._create_buckets()
        
        # Set up replication if enabled
        if self.config.enable_replication and len(self.config.all_regions) > 1:
            self._setup_replication()
    
    def _create_buckets(self):
        """Create S3 buckets in all regions."""
        for region in self.config.all_regions:
            self._create_deployment_bucket(region)
            self._create_log_bucket(region)
    
    def _create_deployment_bucket(self, region: str):
        """
        Create deployment assets bucket for a region.
        
        Args:
            region: AWS region
        """
        bucket_name = self.config.get_resource_name('deployment', region)
        provider = self.provider_manager.get_provider(region)
        
        # Create bucket
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        # Enable versioning if configured
        if self.config.enable_versioning:
            aws.s3.BucketVersioning(
                f"{bucket_name}-versioning",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=ResourceOptions(provider=provider, parent=bucket)
            )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )],
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        # Add lifecycle configuration
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.lifecycle_transition_days,
                            storage_class="STANDARD_IA"
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="expire-old-versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=365
                    )
                )
            ],
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        self.deployment_buckets[region] = bucket
    
    def _create_log_bucket(self, region: str):
        """
        Create logs bucket for a region.
        
        Args:
            region: AWS region
        """
        bucket_name = self.config.get_resource_name('logs', region)
        provider = self.provider_manager.get_provider(region)
        
        # Create bucket
        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_region_tags(region),
            opts=ResourceOptions(provider=provider)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )],
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        # Add lifecycle configuration for logs
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.log_retention_days
                    )
                )
            ],
            opts=ResourceOptions(provider=provider, parent=bucket)
        )
        
        self.log_buckets[region] = bucket
    
    def _setup_replication(self):
        """Set up cross-region replication from primary to secondary regions."""
        # Create replication role in primary region
        primary_provider = self.provider_manager.get_primary_provider()
        role_name = self.config.get_resource_name('s3-replication-role')
        
        self.replication_role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(provider=primary_provider)
        )
        
        # Create replication policy
        primary_bucket = self.deployment_buckets[self.config.primary_region]
        secondary_bucket_arns = [
            self.deployment_buckets[region].arn 
            for region in self.config.secondary_regions
        ]
        
        def create_replication_policy(role_arn, source_arn, *dest_arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [source_arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": [f"{source_arn}/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": [f"{arn}/*" for arn in dest_arns]
                    }
                ]
            })
        
        policy_doc = Output.all(
            self.replication_role.arn,
            primary_bucket.arn,
            *secondary_bucket_arns
        ).apply(lambda args: create_replication_policy(*args))
        
        replication_policy_name = self.config.get_resource_name('s3-replication-policy')
        aws.iam.RolePolicy(
            replication_policy_name,
            role=self.replication_role.id,
            policy=policy_doc,
            opts=ResourceOptions(provider=primary_provider, parent=self.replication_role)
        )
        
        # Configure replication on primary bucket
        replication_rules = []
        for idx, region in enumerate(self.config.secondary_regions):
            dest_bucket = self.deployment_buckets[region]
            replication_rules.append(
                aws.s3.BucketReplicationConfigRuleArgs(
                    id=f"replicate-to-{region}",
                    status="Enabled",
                    priority=idx,
                    filter=aws.s3.BucketReplicationConfigRuleFilterArgs(),
                    destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                        bucket=dest_bucket.arn,
                        storage_class="STANDARD"
                    ),
                    delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                        status="Enabled"
                    )
                )
            )
        
        aws.s3.BucketReplicationConfig(
            f"{primary_bucket._name}-replication",
            bucket=primary_bucket.id,
            role=self.replication_role.arn,
            rules=replication_rules,
            opts=ResourceOptions(provider=primary_provider, parent=primary_bucket)
        )
    
    def get_deployment_bucket(self, region: str) -> aws.s3.Bucket:
        """
        Get deployment bucket for a region.
        
        Args:
            region: AWS region
            
        Returns:
            S3 bucket for deployment assets
        """
        return self.deployment_buckets[region]
    
    def get_deployment_bucket_name(self, region: str) -> Output[str]:
        """
        Get deployment bucket name for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Bucket name as Output
        """
        return self.deployment_buckets[region].bucket
    
    def get_deployment_bucket_arn(self, region: str) -> Output[str]:
        """
        Get deployment bucket ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Bucket ARN as Output
        """
        return self.deployment_buckets[region].arn
    
    def get_log_bucket(self, region: str) -> aws.s3.Bucket:
        """
        Get log bucket for a region.
        
        Args:
            region: AWS region
            
        Returns:
            S3 bucket for logs
        """
        return self.log_buckets[region]
    
    def get_log_bucket_name(self, region: str) -> Output[str]:
        """
        Get log bucket name for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Bucket name as Output
        """
        return self.log_buckets[region].bucket
    
    def get_log_bucket_arn(self, region: str) -> Output[str]:
        """
        Get log bucket ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Bucket ARN as Output
        """
        return self.log_buckets[region].arn

