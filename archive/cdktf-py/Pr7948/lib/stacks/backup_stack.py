"""Backup infrastructure - AWS Backup for Aurora"""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import (
    BackupPlan,
    BackupPlanRule,
    BackupPlanRuleCopyAction,
    BackupPlanRuleLifecycle,
    BackupPlanRuleCopyActionLifecycle
)
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
import json


class BackupStack(Construct):
    """Creates AWS Backup plans with cross-region copy"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        aurora_cluster
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.destination_region = "us-east-2" if region == "us-east-1" else "us-east-1"

        # Backup Vault (primary)
        primary_vault = BackupVault(
            self,
            "primary-vault",
            name=f"dr-backup-vault-{region}-{environment_suffix}",
            tags={
                "Name": f"dr-backup-vault-{region}-{environment_suffix}"
            }
        )

        # Backup Vault (secondary region for cross-region copy)
        secondary_vault = BackupVault(
            self,
            "secondary-vault",
            name=f"dr-backup-vault-{self.destination_region}-{environment_suffix}",
            tags={
                "Name": f"dr-backup-vault-{self.destination_region}-{environment_suffix}"
            }
        )

        # Backup IAM Role
        backup_role = IamRole(
            self,
            "backup-role",
            name=f"dr-backup-role-{region}-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-backup-role-{region}-{environment_suffix}"
            }
        )

        # Attach backup policies
        IamRolePolicyAttachment(
            self,
            "backup-policy-attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )

        IamRolePolicyAttachment(
            self,
            "restore-policy-attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
        )

        # Backup Plan
        # Note: delete_after must be at least 90 days after cold_storage_after
        backup_plan = BackupPlan(
            self,
            "aurora-backup-plan",
            name=f"dr-aurora-backup-{region}-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily-backup",
                target_vault_name=primary_vault.name,
                schedule="cron(0 2 * * ? *)",  # Daily at 2 AM UTC
                start_window=60,
                completion_window=120,
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=120,
                    cold_storage_after=14
                ),
                copy_action=[BackupPlanRuleCopyAction(
                    destination_vault_arn=secondary_vault.arn,
                    lifecycle=BackupPlanRuleCopyActionLifecycle(
                        delete_after=120,
                        cold_storage_after=14
                    )
                )],
                recovery_point_tags={
                    "BackupType": "automated",
                    "EnvironmentSuffix": environment_suffix
                }
            )],
            tags={
                "Name": f"dr-aurora-backup-{region}-{environment_suffix}"
            }
        )

        # Backup Selection (target Aurora cluster)
        BackupSelection(
            self,
            "aurora-backup-selection",
            name="aurora-cluster-selection",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            resources=[aurora_cluster.arn],
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="EnvironmentSuffix",
                value=environment_suffix
            )]
        )
