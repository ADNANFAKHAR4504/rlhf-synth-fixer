"""AWS Backup with cross-region copy."""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleCopyAction, BackupPlanRuleLifecycle, BackupPlanRuleCopyActionLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class BackupStack(Construct):
    """AWS Backup with cross-region copy."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_aurora_cluster_arn: str):
        super().__init__(scope, construct_id)

        # Backup vaults
        primary_vault = BackupVault(
            self, "primary_vault",
            name=f"payment-backup-vault-primary-{environment_suffix}",
            tags={"Name": f"payment-backup-vault-primary-{environment_suffix}"},
            provider=primary_provider,
        )

        secondary_vault = BackupVault(
            self, "secondary_vault",
            name=f"payment-backup-vault-secondary-{environment_suffix}",
            tags={"Name": f"payment-backup-vault-secondary-{environment_suffix}"},
            provider=secondary_provider,
        )

        # IAM role
        backup_role = IamRole(
            self, "backup_role",
            name=f"payment-backup-role-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"backup.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-backup-role-{environment_suffix}"},
            provider=primary_provider,
        )

        for policy in ["service-role/AWSBackupServiceRolePolicyForBackup", "service-role/AWSBackupServiceRolePolicyForRestores"]:
            IamRolePolicyAttachment(
                self, f"attach_{policy.split('/')[-1]}",
                role=backup_role.name,
                policy_arn=f"arn:aws:iam::aws:policy/{policy}",
                provider=primary_provider,
            )

        # Backup plan with cross-region copy
        backup_plan = BackupPlan(
            self, "backup_plan",
            name=f"payment-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily_backup",
                target_vault_name=primary_vault.name,
                schedule="cron(0 3 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=7),
                copy_action=[BackupPlanRuleCopyAction(
                    destination_vault_arn=secondary_vault.arn,
                    lifecycle=BackupPlanRuleCopyActionLifecycle(delete_after=7),
                )],
            )],
            tags={"Name": f"payment-backup-plan-{environment_suffix}"},
            provider=primary_provider,
        )

        # Backup selection
        BackupSelection(
            self, "backup_selection",
            name=f"payment-aurora-backup-{environment_suffix}",
            plan_id=backup_plan.id,
            iam_role_arn=backup_role.arn,
            resources=[primary_aurora_cluster_arn],
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="Name",
                value=f"payment-primary-cluster-{environment_suffix}",
            )],
            provider=primary_provider,
        )