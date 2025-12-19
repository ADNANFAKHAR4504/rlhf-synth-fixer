"""
storage_stack.py

Multi-region storage infrastructure with S3 cross-region replication.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json


class StorageStack(pulumi.ComponentResource):
    """
    Creates multi-region storage infrastructure with replication.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:storage:StorageStack', name, None, opts)

        secondary_provider = aws.Provider(
            f"storage-secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for S3 replication
        replication_role = aws.iam.Role(
            f"s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f's3-replication-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Secondary bucket (destination)
        self.secondary_bucket = aws.s3.Bucket(
            f"ecommerce-assets-secondary-{environment_suffix}",
            bucket=f"ecommerce-assets-secondary-{environment_suffix}",
            tags={**tags, 'Name': f'ecommerce-assets-secondary-{environment_suffix}', 'Region': secondary_region},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Enable versioning on secondary bucket
        aws.s3.BucketVersioningV2(
            f"secondary-bucket-versioning-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Primary bucket (source)
        self.primary_bucket = aws.s3.Bucket(
            f"ecommerce-assets-primary-{environment_suffix}",
            bucket=f"ecommerce-assets-primary-{environment_suffix}",
            tags={**tags, 'Name': f'ecommerce-assets-primary-{environment_suffix}', 'Region': primary_region},
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on primary bucket
        aws.s3.BucketVersioningV2(
            f"primary-bucket-versioning-{environment_suffix}",
            bucket=self.primary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption for primary bucket
        primary_encryption_args = (
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"primary-bucket-encryption-{environment_suffix}",
            bucket=self.primary_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=primary_encryption_args,
            )],
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption for secondary bucket
        secondary_encryption_args = (
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"secondary-bucket-encryption-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=secondary_encryption_args,
            )],
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Replication policy
        replication_policy = aws.iam.RolePolicy(
            f"s3-replication-policy-{environment_suffix}",
            role=replication_role.id,
            policy=pulumi.Output.all(self.primary_bucket.arn, self.secondary_bucket.arn).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetReplicationConfiguration",
                                "s3:ListBucket"
                            ],
                            "Resource": arns[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObjectVersionForReplication",
                                "s3:GetObjectVersionAcl"
                            ],
                            "Resource": f"{arns[0]}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:ReplicateObject",
                                "s3:ReplicateDelete"
                            ],
                            "Resource": f"{arns[1]}/*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure replication
        aws.s3.BucketReplicationConfig(
            f"bucket-replication-{environment_suffix}",
            bucket=self.primary_bucket.id,
            role=replication_role.arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id="replicate-all",
                status="Enabled",
                priority=1,
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(
                    prefix="",
                ),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=self.secondary_bucket.arn,
                    storage_class="STANDARD",
                ),
                delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                    status="Enabled",
                ),
            )],
            opts=ResourceOptions(parent=self, depends_on=[replication_policy])
        )

        # Public access block for both buckets
        aws.s3.BucketPublicAccessBlock(
            f"primary-bucket-public-access-block-{environment_suffix}",
            bucket=self.primary_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        aws.s3.BucketPublicAccessBlock(
            f"secondary-bucket-public-access-block-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Expose outputs
        self.primary_bucket_name = self.primary_bucket.id
        self.secondary_bucket_name = self.secondary_bucket.id
        self.primary_bucket_arn = self.primary_bucket.arn
        self.secondary_bucket_arn = self.secondary_bucket.arn

        self.register_outputs({})
