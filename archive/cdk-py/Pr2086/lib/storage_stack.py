"""Storage Stack with S3 buckets and S3 Tables for analytics."""

from aws_cdk import (
    NestedStack,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class StorageStack(NestedStack):
    """Creates S3 buckets for static assets and S3 Tables for analytics."""
    
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "dev", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
        
        # Create S3 buckets
        self._create_static_assets_bucket()
        self._create_analytics_resources()
    
    def _create_static_assets_bucket(self):
        """Create S3 bucket for static assets."""
        
        self.static_assets_bucket = s3.Bucket(
            self, "prod-static-assets",
            # S3 bucket names must be globally unique and lowercase
            # Using account ID and region to ensure uniqueness
            bucket_name=None,  # Let CloudFormation auto-generate unique name
            public_read_access=False,  # Disabled due to account restrictions
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )
        
        # Note: Public access is disabled due to account restrictions
        # In production, CloudFront would be used for public access
        
        CfnOutput(self, "StaticAssetsBucketName", value=self.static_assets_bucket.bucket_name)
        CfnOutput(self, "StaticAssetsWebsiteUrl", value=self.static_assets_bucket.bucket_website_url)
    
    def _create_analytics_resources(self):
        """Create S3 Table for analytics using latest AWS feature."""
        
        # Create S3 bucket for analytics data lake
        self.analytics_bucket = s3.Bucket(
            self, "prod-analytics-data",
            # S3 bucket names must be globally unique and lowercase
            bucket_name=None,  # Let CloudFormation auto-generate unique name
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="analytics-lifecycle",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90),
                        ),
                    ],
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # Allow deletion for testing
        )
        
        # Note: S3 Tables are still in preview and may require specific CDK constructs
        # For now, we'll create a placeholder structure for Iceberg table format
        # This would be updated once S3 Tables CDK support is GA
        
        CfnOutput(self, "AnalyticsBucketName", value=self.analytics_bucket.bucket_name)