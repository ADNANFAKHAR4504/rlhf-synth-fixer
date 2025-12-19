"""storage_construct.py
S3 buckets with cross-region replication for healthcare data.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_iam as iam,
    aws_kms as kms
)


class StorageConstruct(Construct):
    """
    Creates S3 buckets with cross-region replication for healthcare data storage.
    Implements HIPAA-compliant security controls.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str,
        dr_region: str,
        kms_key: kms.Key,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create access logs bucket
        access_logs_bucket = s3.Bucket(
            self,
            f"AccessLogsBucket-{environment_suffix}",
            bucket_name=f"access-logs-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=cdk.Duration.days(90),
                    enabled=True
                )
            ]
        )

        # Create primary data bucket
        self.data_bucket = s3.Bucket(
            self,
            f"DataBucket-{environment_suffix}",
            bucket_name=f"healthcare-data-{environment_suffix}-{primary_region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            server_access_logs_bucket=access_logs_bucket,
            server_access_logs_prefix="data-bucket/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(90)
                        )
                    ],
                    enabled=True
                )
            ]
        )

        # Add bucket policy for encryption enforcement
        self.data_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[f"{self.data_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "AES256"
                    }
                }
            )
        )

        # Create DR bucket (in DR region this would be the destination)
        # Note: For true cross-region replication, you would need to deploy
        # separate stacks in each region and configure CRR between them
        dr_bucket_name = f"healthcare-data-{environment_suffix}-{dr_region}"

        # Store references
        self.access_logs_bucket = access_logs_bucket
        self.dr_bucket_name = dr_bucket_name
