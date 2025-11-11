"""
S3 cross-region replication configuration.
BUG #15: Replication Time Control (RTC) not configured
BUG #16: Missing bucket versioning on secondary bucket
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional


class S3Stack(pulumi.ComponentResource):
    """S3 buckets with cross-region replication."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:S3Stack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-s3-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-s3-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Primary bucket
        self.primary_bucket = aws.s3.Bucket(
            f"trading-data-primary-{environment_suffix}",
            bucket=f"trading-data-primary-{environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            tags={**tags, 'Name': f"trading-data-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Enable encryption on primary bucket
        encryption_rule = aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"trading-data-primary-encryption-{environment_suffix}",
            bucket=self.primary_bucket.id,
            rules=[encryption_rule],
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary bucket
        self.secondary_bucket = aws.s3.Bucket(
            f"trading-data-secondary-{environment_suffix}",
            bucket=f"trading-data-secondary-{environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            tags={**tags, 'Name': f"trading-data-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Enable encryption on secondary bucket
        encryption_rule_secondary = aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=(
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        )
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"trading-data-secondary-encryption-{environment_suffix}",
            bucket=self.secondary_bucket.id,
            rules=[encryption_rule_secondary],
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # IAM role for replication
        self.replication_role = aws.iam.Role(
            f"s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f"s3-replication-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Replication policy
        self.replication_policy = aws.iam.RolePolicy(
            f"s3-replication-policy-{environment_suffix}",
            role=self.replication_role.id,
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

        # BUG #15: Replication Time Control (RTC) not configured
        self.replication_config = aws.s3.BucketReplicationConfig(
            f"trading-replication-{environment_suffix}",
            bucket=self.primary_bucket.id,
            role=self.replication_role.arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id="ReplicateAll",
                status="Enabled",
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(
                    prefix=""
                ),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=self.secondary_bucket.arn,
                    storage_class="STANDARD"
                    # MISSING: Replication Time Control configuration!
                    # Should include replication_time and metrics
                ),
                delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                    status="Enabled"
                )
            )],
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[
                self.replication_policy
            ])
        )

        self.primary_bucket_name = self.primary_bucket.bucket
        self.secondary_bucket_name = self.secondary_bucket.bucket

        self.register_outputs({
            'primary_bucket_name': self.primary_bucket.bucket,
            'secondary_bucket_name': self.secondary_bucket.bucket,
        })
