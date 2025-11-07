"""
storage.py

S3 and DynamoDB storage infrastructure.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class StorageStack(pulumi.ComponentResource):
    """
    Creates S3 and DynamoDB storage infrastructure.
    """

    def __init__(
        self,
        name: str,
        *,
        enable_versioning: bool,
        lifecycle_days: Optional[int],
        dynamodb_billing_mode: str,
        enable_encryption: bool,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        # Create KMS key for encryption if enabled
        self.kms_key = None
        if enable_encryption:
            self.kms_key = aws.kms.Key(
                f'storage-kms-key-{environment_suffix}',
                description=f'KMS key for storage encryption - {environment_suffix}',
                deletion_window_in_days=10,
                tags={**tags, 'Name': f'storage-kms-key-{environment_suffix}'},
                opts=ResourceOptions(parent=self)
            )

            aws.kms.Alias(
                f'storage-kms-alias-{environment_suffix}',
                name=f'alias/storage-{environment_suffix}',
                target_key_id=self.kms_key.id,
                opts=ResourceOptions(parent=self)
            )

        # Create S3 bucket
        bucket_args = {
            'bucket': f'payment-documents-{environment_suffix}',
            'tags': {**tags, 'Name': f'payment-documents-{environment_suffix}'},
        }

        self.s3_bucket = aws.s3.Bucket(
            f's3-bucket-{environment_suffix}',
            **bucket_args,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning if required
        if enable_versioning:
            aws.s3.BucketVersioningV2(
                f's3-versioning-{environment_suffix}',
                bucket=self.s3_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                ),
                opts=ResourceOptions(parent=self)
            )

        # Configure server-side encryption
        sse_algorithm = 'aws:kms' if enable_encryption else 'AES256'
        kms_key = self.kms_key.id if enable_encryption else None

        aws.s3.BucketServerSideEncryptionConfiguration(
            f's3-encryption-{environment_suffix}',
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm=sse_algorithm,
                            kms_master_key_id=kms_key
                        )
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Configure lifecycle rules if specified
        if lifecycle_days:
            aws.s3.BucketLifecycleConfigurationV2(
                f's3-lifecycle-{environment_suffix}',
                bucket=self.s3_bucket.id,
                rules=[
                    aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                        id='expire-old-documents',
                        status='Enabled',
                        expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                            days=lifecycle_days
                        )
                    )
                ],
                opts=ResourceOptions(parent=self)
            )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f's3-public-access-block-{environment_suffix}',
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for session management
        dynamodb_args = {
            'name': f'payment-sessions-{environment_suffix}',
            'billing_mode': dynamodb_billing_mode,
            'hash_key': 'sessionId',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='sessionId',
                    type='S'
                )
            ],
            'tags': {**tags, 'Name': f'payment-sessions-{environment_suffix}'},
        }

        # Add provisioned throughput for PROVISIONED mode
        if dynamodb_billing_mode == 'PROVISIONED':
            dynamodb_args['read_capacity'] = 5
            dynamodb_args['write_capacity'] = 5

        # Add encryption if enabled
        if enable_encryption:
            dynamodb_args['server_side_encryption'] = aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            )

        self.dynamodb_table = aws.dynamodb.Table(
            f'dynamodb-table-{environment_suffix}',
            **dynamodb_args,
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.s3_bucket_name = self.s3_bucket.id
        self.dynamodb_table_name = self.dynamodb_table.name

        self.register_outputs({
            's3_bucket_name': self.s3_bucket_name,
            'dynamodb_table_name': self.dynamodb_table_name
        })
