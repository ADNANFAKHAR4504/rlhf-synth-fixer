"""Data storage module for S3 buckets with encryption and policies."""

import json
from constructs import Construct
from cdktf import Token
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.s3_bucket_logging import S3BucketLoggingA
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class DataStorageModule(Construct):
    """Data storage infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kms_key_id: str,
        vpc_id: str,
        flow_logs_bucket_arn: str,
    ):
        """Initialize data storage module."""
        super().__init__(scope, construct_id)

        caller = DataAwsCallerIdentity(self, "caller")

        # Create access logs bucket
        access_logs_bucket = S3Bucket(
            self,
            "access_logs_bucket",
            bucket=f"s3-access-logs-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"access-logs-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        S3BucketPublicAccessBlock(
            self,
            "access_logs_public_block",
            bucket=access_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Create main data bucket
        self.data_bucket = S3Bucket(
            self,
            "data_bucket",
            bucket=f"secure-data-bucket-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"data-bucket-{environment_suffix}",
                "Environment": environment_suffix,
                "DataClassification": "Confidential",
            },
        )

        self.data_bucket_name = self.data_bucket.bucket
        self.data_bucket_arn = self.data_bucket.arn

        # Enable versioning
        S3BucketVersioningA(
            self,
            "data_bucket_versioning",
            bucket=self.data_bucket.id,
            versioning_configuration={
                "status": "Enabled",
                "mfa_delete": "Disabled",  # MFA delete requires manual configuration
            },
        )

        # Enable encryption with KMS
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "data_bucket_encryption",
            bucket=self.data_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "aws:kms",
                    "kms_master_key_id": kms_key_id,
                },
                "bucket_key_enabled": True,
            }],
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "data_bucket_public_block",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Enable access logging
        S3BucketLoggingA(
            self,
            "data_bucket_logging",
            bucket=self.data_bucket.id,
            target_bucket=access_logs_bucket.id,
            target_prefix=f"data-bucket-logs-{environment_suffix}/",
        )

        # Bucket policy denying unencrypted uploads
        bucket_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "DenyUnencryptedObjectUploads",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:PutObject",
                    "Resource": f"${{{self.data_bucket.arn}}}/*",
                    "Condition": {
                        "StringNotEquals": {
                            "s3:x-amz-server-side-encryption": "aws:kms"
                        }
                    }
                },
                {
                    "Sid": "DenyInsecureTransport",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        f"${{{self.data_bucket.arn}}}",
                        f"${{{self.data_bucket.arn}}}/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }
        
        S3BucketPolicy(
            self,
            "data_bucket_policy",
            bucket=self.data_bucket.id,
            policy=json.dumps(bucket_policy_doc),
        )
