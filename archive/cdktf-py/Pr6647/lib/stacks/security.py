import json

from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from constructs import Construct


class SecurityModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Primary KMS Key
        self.primary_kms_key = KmsKey(self, "primary-kms-key",
            provider=primary_provider,
            description=f"KMS key for payment processing encryption in primary region",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                "Name": f"payment-kms-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # FIXED: KMS alias with environmentSuffix
        KmsAlias(self, "primary-kms-alias",
            provider=primary_provider,
            name=f"alias/payment-primary-{environment_suffix}",
            target_key_id=self.primary_kms_key.key_id
        )

        # Secondary KMS Key
        self.secondary_kms_key = KmsKey(self, "secondary-kms-key",
            provider=secondary_provider,
            description=f"KMS key for payment processing encryption in secondary region",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                "Name": f"payment-kms-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # FIXED: KMS alias with environmentSuffix
        KmsAlias(self, "secondary-kms-alias",
            provider=secondary_provider,
            name=f"alias/payment-secondary-{environment_suffix}",
            target_key_id=self.secondary_kms_key.key_id
        )

        # ECS Execution Role
        self.ecs_execution_role = IamRole(self, "ecs-execution-role",
            provider=primary_provider,
            name=f"payment-ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-ecs-execution-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        IamRolePolicyAttachment(self, "ecs-execution-policy",
            provider=primary_provider,
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # ECS Task Role
        self.ecs_task_role = IamRole(self, "ecs-task-role",
            provider=primary_provider,
            name=f"payment-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-ecs-task-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing IAM policy for S3 bucket access
        # ECS tasks need access to S3 buckets for transaction logs

        # ISSUE: Missing IAM policy for KMS access
        # ECS tasks need KMS decrypt permissions


        # FIXED: ECS task role with proper policies
        ecs_task_policy = IamPolicy(self, "ecs-task-policy",
            provider=primary_provider,
            name=f"payment-ecs-task-policy-{environment_suffix}",
            description="Policy for ECS tasks to access S3 and KMS",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::payment-transaction-logs-*-{environment_suffix}/*",
                            f"arn:aws:s3:::payment-audit-trails-*-{environment_suffix}/*",
                            f"arn:aws:s3:::payment-transaction-logs-*-{environment_suffix}",
                            f"arn:aws:s3:::payment-audit-trails-*-{environment_suffix}"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": [
                            self.primary_kms_key.arn,
                            self.secondary_kms_key.arn
                        ]
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "ecs-task-policy-attachment",
            provider=primary_provider,
            role=self.ecs_task_role.name,
            policy_arn=ecs_task_policy.arn
        )

        # FIXED: S3 replication role with proper policies
        s3_replication_policy = IamPolicy(self, "s3-replication-policy",
            provider=primary_provider,
            name=f"payment-s3-replication-policy-{environment_suffix}",
            description="Policy for S3 cross-region replication",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::payment-transaction-logs-primary-{environment_suffix}",
                            f"arn:aws:s3:::payment-audit-trails-primary-{environment_suffix}"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl",
                            "s3:GetObjectVersionTagging"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::payment-transaction-logs-primary-{environment_suffix}/*",
                            f"arn:aws:s3:::payment-audit-trails-primary-{environment_suffix}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete",
                            "s3:ReplicateTags"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::payment-transaction-logs-secondary-{environment_suffix}/*",
                            f"arn:aws:s3:::payment-audit-trails-secondary-{environment_suffix}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": [self.primary_kms_key.arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": [self.secondary_kms_key.arn]
                    }
                ]
            })
        )

        # S3 Replication Role must be created first
        self.s3_replication_role = IamRole(self, "s3-replication-role",
            provider=primary_provider,
            name=f"payment-s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-s3-replication-role-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        IamRolePolicyAttachment(self, "s3-replication-policy-attachment",
            provider=primary_provider,
            role=self.s3_replication_role.name,
            policy_arn=s3_replication_policy.arn
        )

        # Note: DynamoDB table for state locking is no longer needed 
        # as we're using S3's native state locking with use_lockfile=True

