"""
Storage infrastructure - S3 buckets with encryption, lifecycle, and replication.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_s3 as s3,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class StorageStackProps:
    """Properties for StorageStack."""

    def __init__(self, environment_suffix: str, kms_key: kms.Key):
        self.environment_suffix = environment_suffix
        self.kms_key = kms_key


class StorageStack(NestedStack):
    """S3 storage infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: StorageStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Destination bucket for cross-region replication
        self.replication_bucket = s3.Bucket(
            self,
            f"ReplicationBucket-{env_suffix}",
            bucket_name=f"payment-docs-replica-{env_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Primary document storage bucket
        self.document_bucket = s3.Bucket(
            self,
            f"DocumentBucket-{env_suffix}",
            bucket_name=f"payment-docs-{env_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id=f"TransitionToIA-{env_suffix}",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(180)
                        )
                    ],
                    enabled=True
                ),
                s3.LifecycleRule(
                    id=f"ExpireOldVersions-{env_suffix}",
                    noncurrent_version_expiration=Duration.days(30),
                    enabled=True
                )
            ],
            removal_policy=RemovalPolicy.DESTROY
        )

        CfnOutput(
            self,
            "DocumentBucketName",
            value=self.document_bucket.bucket_name,
            description="Document storage bucket name"
        )

        CfnOutput(
            self,
            "ReplicationBucketName",
            value=self.replication_bucket.bucket_name,
            description="Replication bucket name"
        )
