"""AWS Backup for Aurora database."""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class BackupStack(Construct):
    """AWS Backup for Aurora database."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, aurora_cluster_arn: str):
        super().__init__(scope, construct_id)

        # Backup vault
        vault = BackupVault(
            self, "vault",
            name=f"payment-backup-vault-{environment_suffix}",
            tags={"Name": f"payment-backup-vault-{environment_suffix}"},
            provider=provider,
        )

        # IAM role
        backup_role = IamRole(
            self, "backup_role",
            name=f"payment-backup-role-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"backup.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-backup-role-{environment_suffix}"},
            provider=provider,
        )

        for policy in ["service-role/AWSBackupServiceRolePolicyForBackup", "service-role/AWSBackupServiceRolePolicyForRestores"]:
            IamRolePolicyAttachment(
                self, f"attach_{policy.split('/')[-1]}",
                role=backup_role.name,
                policy_arn=f"arn:aws:iam::aws:policy/{policy}",
                provider=provider,
            )

        # Backup plan
        backup_plan = BackupPlan(
            self, "backup_plan",
            name=f"payment-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily_backup",
                target_vault_name=vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=7),
            )],
            tags={"Name": f"payment-backup-plan-{environment_suffix}"},
            provider=provider,
        )

        # Backup selection
        BackupSelection(
            self, "backup_selection",
            name=f"payment-aurora-backup-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            resources=[aurora_cluster_arn],
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="Name",
                value=f"payment-cluster-{environment_suffix}",
            )],
            provider=provider,
        )
