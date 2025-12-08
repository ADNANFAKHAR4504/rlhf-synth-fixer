from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy


class StorageConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_region: str,
        secondary_region: str
    ):
        super().__init__(scope, construct_id)

        # Primary S3 bucket
        self.primary_bucket = S3Bucket(
            self,
            "primary-bucket",
            bucket=f"trading-data-primary-{environment_suffix}",
            tags={"Name": f"trading-data-primary-{environment_suffix}"},
            provider=primary_provider
        )

        # Enable versioning on primary bucket
        S3BucketVersioningA(
            self,
            "primary-bucket-versioning",
            bucket=self.primary_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=primary_provider
        )

        # Secondary S3 bucket
        self.secondary_bucket = S3Bucket(
            self,
            "secondary-bucket",
            bucket=f"trading-data-secondary-{environment_suffix}",
            tags={"Name": f"trading-data-secondary-{environment_suffix}"},
            provider=secondary_provider
        )

        # Enable versioning on secondary bucket
        secondary_versioning = S3BucketVersioningA(
            self,
            "secondary-bucket-versioning",
            bucket=self.secondary_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=secondary_provider
        )

        # IAM role for replication
        replication_role = IamRole(
            self,
            "replication-role",
            name=f"s3-replication-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            provider=primary_provider
        )

        # Replication policy
        IamRolePolicy(
            self,
            "replication-policy",
            name=f"s3-replication-policy-{environment_suffix}",
            role=replication_role.id,
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [self.primary_bucket.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": [f"{self.primary_bucket.arn}/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": [f"{self.secondary_bucket.arn}/*"]
                    }
                ]
            }),
            provider=primary_provider
        )

        # S3 replication configuration - depends on secondary versioning being enabled
        S3BucketReplicationConfigurationA(
            self,
            "replication-config",
            bucket=self.primary_bucket.id,
            role=replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="replicate-all",
                    status="Enabled",
                    priority=1,
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=self.secondary_bucket.arn,
                        storage_class="STANDARD"
                    )
                )
            ],
            provider=primary_provider,
            depends_on=[secondary_versioning]
        )

    @property
    def primary_bucket_name(self):
        return self.primary_bucket.bucket

    @property
    def secondary_bucket_name(self):
        return self.secondary_bucket.bucket
