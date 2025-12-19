"""Remote state backend module for S3 and DynamoDB."""
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute
from cdktf import TerraformOutput
from .naming import NamingModule


class StateBackendModule(Construct):
    """Module for Terraform state backend resources."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        naming: NamingModule
    ):
        super().__init__(scope, id)

        # S3 Bucket for Terraform State
        self.state_bucket = S3Bucket(
            self,
            "state_bucket",
            bucket=naming.generate_unique_name("tfstate"),
            force_destroy=True,
            tags={
                "Name": naming.generate_unique_name("tfstate"),
                "Environment": naming.environment,
                "Purpose": "Terraform State"
            }
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "state_bucket_versioning",
            bucket=self.state_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "state_bucket_encryption",
            bucket=self.state_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "state_bucket_public_access_block",
            bucket=self.state_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # DynamoDB Table for State Locking
        self.lock_table = DynamodbTable(
            self,
            "lock_table",
            name=naming.generate_unique_name("tflock"),
            billing_mode="PAY_PER_REQUEST",
            hash_key="LockID",
            attribute=[
                DynamodbTableAttribute(
                    name="LockID",
                    type="S"
                )
            ],
            deletion_protection_enabled=False,
            tags={
                "Name": naming.generate_unique_name("tflock"),
                "Environment": naming.environment,
                "Purpose": "Terraform State Locking"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "state_bucket_name",
            value=self.state_bucket.bucket,
            description="S3 bucket for Terraform state"
        )

        TerraformOutput(
            self,
            "lock_table_name",
            value=self.lock_table.name,
            description="DynamoDB table for state locking"
        )
