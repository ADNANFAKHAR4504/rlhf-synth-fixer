"""security_construct.py
KMS encryption keys, CloudTrail, and security configurations.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_kms as kms,
    aws_cloudtrail as cloudtrail,
    aws_s3 as s3,
    aws_iam as iam
)


class SecurityConstruct(Construct):
    """
    Creates security resources including KMS keys, CloudTrail, and IAM policies
    for HIPAA-compliant healthcare data platform.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str,
        dr_region: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for encryption
        self.kms_key = kms.Key(
            self,
            f"EncryptionKey-{environment_suffix}",
            alias=f"healthcare-key-{environment_suffix}",
            description="KMS key for healthcare data encryption",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            pending_window=cdk.Duration.days(7)
        )

        # Grant necessary permissions for CloudWatch Logs
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
                principals=[
                    iam.ServicePrincipal(f"logs.{primary_region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn":
                        f"arn:aws:logs:{primary_region}:{cdk.Aws.ACCOUNT_ID}:*"
                    }
                }
            )
        )

        # Create CloudTrail S3 bucket
        cloudtrail_bucket = s3.Bucket(
            self,
            f"CloudTrailBucket-{environment_suffix}",
            bucket_name=f"cloudtrail-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True
        )

        # Create CloudTrail
        trail = cloudtrail.Trail(
            self,
            f"AuditTrail-{environment_suffix}",
            trail_name=f"healthcare-trail-{environment_suffix}",
            bucket=cloudtrail_bucket,
            enable_file_validation=True,
            include_global_service_events=True,
            is_multi_region_trail=True,
            management_events=cloudtrail.ReadWriteType.ALL,
            send_to_cloud_watch_logs=True
        )

        # Store references
        self.cloudtrail_bucket = cloudtrail_bucket
        self.trail = trail
