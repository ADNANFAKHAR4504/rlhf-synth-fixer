"""compliance_storage_construct.py
S3 buckets for audit reports and AWS Config storage.
"""

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_kms as kms
from constructs import Construct


class ComplianceStorageConstruct(Construct):
    """
    Storage infrastructure for compliance auditing system.

    Creates S3 buckets with KMS encryption, versioning, and lifecycle policies.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # KMS key for audit bucket encryption
        self.audit_kms_key = kms.Key(
            self,
            "AuditBucketKey",
            description=f"KMS key for audit bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # KMS key for Config bucket encryption
        self.config_kms_key = kms.Key(
            self,
            "ConfigBucketKey",
            description=f"KMS key for Config bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Grant AWS Config service access to the key
        self.config_kms_key.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="Allow Config to use the key",
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                resources=["*"]
            )
        )

        # S3 bucket for audit reports
        self.audit_bucket = s3.Bucket(
            self,
            "AuditReportBucket",
            bucket_name=f"compliance-audit-reports-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.audit_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldReports",
                    enabled=True,
                    expiration=cdk.Duration.days(90)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        )
                    ]
                )
            ]
        )

        # S3 bucket for AWS Config
        self.config_bucket = s3.Bucket(
            self,
            "ConfigBucket",
            bucket_name=f"compliance-config-data-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.config_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Grant AWS Config service access to the bucket
        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketPermissionsCheck",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:GetBucketAcl"],
                resources=[self.config_bucket.bucket_arn]
            )
        )

        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketExistenceCheck",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:ListBucket"],
                resources=[self.config_bucket.bucket_arn]
            )
        )

        self.config_bucket.add_to_resource_policy(
            cdk.aws_iam.PolicyStatement(
                sid="AWSConfigBucketPutObject",
                effect=cdk.aws_iam.Effect.ALLOW,
                principals=[
                    cdk.aws_iam.ServicePrincipal("config.amazonaws.com")
                ],
                actions=["s3:PutObject"],
                resources=[f"{self.config_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
