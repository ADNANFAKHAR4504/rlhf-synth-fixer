"""Storage infrastructure including S3, DynamoDB, and KMS."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration,
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import (
    S3BucketPublicAccessBlock,
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition,
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery,
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class StorageConstruct(Construct):
    """Construct for storage infrastructure."""

    def __init__(
        self, scope: Construct, construct_id: str, environment_suffix: str, vpc_id: str
    ):
        """Initialize storage infrastructure."""
        super().__init__(scope, construct_id)

        # Create KMS key for encryption
        self.kms_key = KmsKey(
            self,
            "kms_key",
            description=f"KMS key for healthcare data encryption - {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={"Name": f"healthcare-kms-key-{environment_suffix}"},
        )

        KmsAlias(
            self,
            "kms_key_alias",
            name=f"alias/healthcare-{environment_suffix}",
            target_key_id=self.kms_key.key_id,
        )

        # Create S3 bucket for healthcare data
        self.data_bucket = S3Bucket(
            self,
            "data_bucket",
            bucket=f"healthcare-data-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"healthcare-data-{environment_suffix}"},
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "data_bucket_versioning",
            bucket=self.data_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "data_bucket_encryption",
            bucket=self.data_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ],
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "data_bucket_public_access_block",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Lifecycle policy for cost optimization
        S3BucketLifecycleConfiguration(
            self,
            "data_bucket_lifecycle",
            bucket=self.data_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-ia",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=30, storage_class="STANDARD_IA"
                        )
                    ],
                )
            ],
        )

        # Create CloudTrail bucket
        cloudtrail_bucket = S3Bucket(
            self,
            "cloudtrail_bucket",
            bucket=f"healthcare-cloudtrail-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"healthcare-cloudtrail-{environment_suffix}"},
        )

        S3BucketPublicAccessBlock(
            self,
            "cloudtrail_bucket_public_access_block",
            bucket=cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # CloudTrail bucket policy
        S3BucketPolicy(
            self,
            "cloudtrail_bucket_policy",
            bucket=cloudtrail_bucket.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}",
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}/*",
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            },
                        },
                    ],
                }
            ),
        )

        # Create CloudTrail for audit logging
        Cloudtrail(
            self,
            "cloudtrail",
            name=f"healthcare-trail-{environment_suffix}",
            s3_bucket_name=cloudtrail_bucket.id,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            tags={"Name": f"healthcare-trail-{environment_suffix}"},
        )

        # Create DynamoDB table for patient records
        self.dynamodb_table = DynamodbTable(
            self,
            "patient_records_table",
            name=f"healthcare-patient-records-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="patient_id",
            attribute=[DynamodbTableAttribute(name="patient_id", type="S")],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption={"enabled": True},
            tags={"Name": f"healthcare-patient-records-{environment_suffix}"},
        )

        # Export values
        self.data_bucket_name = self.data_bucket.bucket
        self.data_bucket_arn = self.data_bucket.arn
        self.dynamodb_table_name = self.dynamodb_table.name
        self.dynamodb_table_arn = self.dynamodb_table.arn
        self.kms_key_arn = self.kms_key.arn
