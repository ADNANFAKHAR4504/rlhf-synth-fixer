"""S3 Cross-Region Replication Configuration Stack

This stack is deployed after both primary and secondary regional stacks
to configure S3 cross-region replication once both buckets exist.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleDestinationReplicationTime,
    S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime,
    S3BucketReplicationConfigurationRuleDestinationMetrics,
    S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold,
    S3BucketReplicationConfigurationRuleFilter,
    S3BucketReplicationConfigurationRuleDeleteMarkerReplication
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class ReplicationStack(Construct):
    """Creates S3 cross-region replication after both buckets exist"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_bucket_id: str,
        primary_bucket_arn: str,
        secondary_bucket_arn: str
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Replication IAM role
        replication_role = IamRole(
            self,
            "replication-role",
            name=f"dr-s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-s3-replication-role-{environment_suffix}"
            }
        )

        # Replication policy
        IamRolePolicy(
            self,
            "replication-policy",
            name="s3-replication-policy",
            role=replication_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [primary_bucket_arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl",
                            "s3:GetObjectVersionTagging"
                        ],
                        "Resource": [f"{primary_bucket_arn}/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete",
                            "s3:ReplicateTags"
                        ],
                        "Resource": [f"{secondary_bucket_arn}/*"]
                    }
                ]
            })
        )

        # Replication configuration with RTC (Replication Time Control)
        S3BucketReplicationConfigurationA(
            self,
            "replication-config",
            bucket=primary_bucket_id,
            role=replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id="replicate-all",
                status="Enabled",
                priority=1,
                delete_marker_replication=S3BucketReplicationConfigurationRuleDeleteMarkerReplication(
                    status="Enabled"
                ),
                filter=S3BucketReplicationConfigurationRuleFilter(
                    prefix=""
                ),
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=secondary_bucket_arn,
                    storage_class="STANDARD",
                    replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                        status="Enabled",
                        time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(
                            minutes=15
                        )
                    ),
                    metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                        status="Enabled",
                        event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(
                            minutes=15
                        )
                    )
                )
            )]
        )
