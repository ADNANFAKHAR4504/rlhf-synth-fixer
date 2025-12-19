"""AWS Backup infrastructure for disaster recovery."""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import (
    BackupPlan,
    BackupPlanRule,
    BackupPlanRuleLifecycle,
)
from cdktf_cdktf_provider_aws.backup_selection import (
    BackupSelection,
    BackupSelectionSelectionTag,
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
import json


class BackupConstruct(Construct):
    """Construct for AWS Backup infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        dynamodb_table_arn: str,
    ):
        """Initialize backup infrastructure."""
        super().__init__(scope, construct_id)

        # Create backup vault
        vault = BackupVault(
            self, "backup_vault", name=f"healthcare-backup-vault-{environment_suffix}"
        )

        # Create backup IAM role
        backup_role = IamRole(
            self,
            "backup_role",
            name=f"healthcare-backup-role-{environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "backup.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
        )

        # Attach AWS Backup service role policies
        IamRolePolicyAttachment(
            self,
            "backup_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
        )

        IamRolePolicyAttachment(
            self,
            "restore_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
        )

        # Create backup plan
        plan = BackupPlan(
            self,
            "backup_plan",
            name=f"healthcare-backup-plan-{environment_suffix}",
            rule=[
                BackupPlanRule(
                    rule_name="daily_backup",
                    target_vault_name=vault.name,
                    schedule="cron(0 2 * * ? *)",  # Daily at 2 AM UTC
                    lifecycle=BackupPlanRuleLifecycle(
                        delete_after=7  # Retain for 7 days
                    ),
                )
            ],
        )

        # Create backup selection
        BackupSelection(
            self,
            "backup_selection",
            name=f"healthcare-resources-{environment_suffix}",
            iam_role_arn=backup_role.arn,
            plan_id=plan.id,
            resources=[dynamodb_table_arn],
        )
