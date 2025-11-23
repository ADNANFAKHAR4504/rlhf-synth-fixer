"""Storage infrastructure including S3 buckets with compliance features."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_object_lock_configuration import (
    S3BucketObjectLockConfigurationA,
    S3BucketObjectLockConfigurationRuleA,
    S3BucketObjectLockConfigurationRuleDefaultRetentionA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from constructs import Construct


class StorageStack(Construct):
    """Creates S3 buckets for audit logs with compliance features."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn

        # Create audit logs bucket with object lock
        self.audit_bucket = S3Bucket(
            self,
            "audit_bucket",
            bucket=f"payment-audit-logs-{environment_suffix}",
            object_lock_enabled=True,
            tags={
                "Name": f"payment-audit-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "audit_bucket_versioning",
            bucket=self.audit_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled",
                mfa_delete="Disabled"  # MFA delete requires manual configuration
            )
        )

        # Configure server-side encryption with KMS
        encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key_arn
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "audit_bucket_encryption",
            bucket=self.audit_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=encryption_default,
                    bucket_key_enabled=True
                )
            ]
        )

        # Configure object lock
        S3BucketObjectLockConfigurationA(
            self,
            "audit_bucket_object_lock",
            bucket=self.audit_bucket.id,
            rule=S3BucketObjectLockConfigurationRuleA(
                default_retention=S3BucketObjectLockConfigurationRuleDefaultRetentionA(
                    mode="COMPLIANCE",
                    days=2555  # 7 years retention
                )
            )
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "audit_bucket_public_access_block",
            bucket=self.audit_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Create compliance logs bucket
        self.compliance_bucket = S3Bucket(
            self,
            "compliance_bucket",
            bucket=f"payment-compliance-logs-{environment_suffix}",
            tags={
                "Name": f"payment-compliance-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Enable versioning on compliance bucket
        S3BucketVersioningA(
            self,
            "compliance_bucket_versioning",
            bucket=self.compliance_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Configure encryption on compliance bucket
        compliance_encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="aws:kms",
            kms_master_key_id=self.kms_key_arn
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "compliance_bucket_encryption",
            bucket=self.compliance_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=compliance_encryption_default,
                    bucket_key_enabled=True
                )
            ]
        )

        # Block public access on compliance bucket
        S3BucketPublicAccessBlock(
            self,
            "compliance_bucket_public_access_block",
            bucket=self.compliance_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Outputs
        TerraformOutput(
            self,
            "audit_bucket_name",
            value=self.audit_bucket.bucket,
            description="Audit logs S3 bucket name"
        )

        TerraformOutput(
            self,
            "compliance_bucket_name",
            value=self.compliance_bucket.bucket,
            description="Compliance logs S3 bucket name"
        )
