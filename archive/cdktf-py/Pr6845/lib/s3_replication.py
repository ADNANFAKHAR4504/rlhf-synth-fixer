"""S3 Cross-Region Replication configuration helper for CDKTF Python."""

from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfiguration,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleFilter,
    S3BucketReplicationConfigurationRuleDeleteMarkerReplication,
)


def create_s3_replication_role(
    scope,
    construct_id: str,
    environment_suffix: str,
    source_bucket_arn: str,
    destination_bucket_arn: str,
    destination_kms_key_arn: str,
):
    """Create IAM role for S3 replication."""

    role = IamRole(
        scope,
        construct_id,
        name=f"{construct_id}-{environment_suffix}",
        assume_role_policy="""{
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "s3.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        }""",
        tags={"Name": f"{construct_id}-{environment_suffix}"}
    )

    IamRolePolicy(
        scope,
        f"{construct_id}_policy",
        role=role.id,
        name=f"{construct_id}-policy-{environment_suffix}",
        policy=f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ],
                    "Resource": "{source_bucket_arn}"
                }},
                {{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionTagging"
                    ],
                    "Resource": "{source_bucket_arn}/*"
                }},
                {{
                    "Effect": "Allow",
                    "Action": [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                        "s3:ReplicateTags"
                    ],
                    "Resource": "{destination_bucket_arn}/*"
                }},
                {{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": "*",
                    "Condition": {{
                        "StringLike": {{
                            "kms:ViaService": "s3.*.amazonaws.com"
                        }}
                    }}
                }},
                {{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Encrypt"
                    ],
                    "Resource": "{destination_kms_key_arn}"
                }}
            ]
        }}"""
    )

    return role


def configure_s3_replication(
    scope,
    construct_id: str,
    source_bucket_id: str,
    destination_bucket_arn: str,
    replication_role_arn: str,
    destination_kms_key_arn: str,
    provider=None,
):
    """Configure S3 cross-region replication."""

    replication_config = S3BucketReplicationConfiguration(
        scope,
        construct_id,
        bucket=source_bucket_id,
        role=replication_role_arn,
        rule=[S3BucketReplicationConfigurationRule(
            id="replication-rule",
            status="Enabled",
            priority=1,
            filter=S3BucketReplicationConfigurationRuleFilter(
                prefix=""  # Replicate all objects
            ),
            destination=S3BucketReplicationConfigurationRuleDestination(
                bucket=destination_bucket_arn,
                storage_class="STANDARD",
                encryption_configuration={
                    "replica_kms_key_id": destination_kms_key_arn
                }
            ),
            delete_marker_replication=S3BucketReplicationConfigurationRuleDeleteMarkerReplication(
                status="Enabled"
            )
        )],
        provider=provider
    )

    return replication_config
