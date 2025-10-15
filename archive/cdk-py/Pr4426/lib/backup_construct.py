"""backup_construct.py
AWS Backup plans and vaults for disaster recovery.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_backup as backup,
    aws_rds as rds,
    aws_iam as iam,
    aws_kms as kms,
    aws_events as events
)


class BackupConstruct(Construct):
    """
    Creates AWS Backup plans and vaults for database backup and recovery.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        db_cluster: rds.DatabaseCluster,
        kms_key: kms.Key,
        dr_region: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create backup vault
        backup_vault = backup.BackupVault(
            self,
            f"BackupVault-{environment_suffix}",
            backup_vault_name=f"healthcare-vault-{environment_suffix}",
            encryption_key=kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create backup plan
        backup_plan = backup.BackupPlan(
            self,
            f"BackupPlan-{environment_suffix}",
            backup_plan_name=f"healthcare-backup-plan-{environment_suffix}",
            backup_vault=backup_vault,
            backup_plan_rules=[
                backup.BackupPlanRule(
                    rule_name="DailyBackup",
                    schedule_expression=events.Schedule.cron(
                        hour="2",
                        minute="0"
                    ),
                    start_window=cdk.Duration.hours(1),
                    completion_window=cdk.Duration.hours(2),
                    delete_after=cdk.Duration.days(30)
                    # Removed move_to_cold_storage_after to avoid AWS Backup 90-day gap requirement
                ),
                backup.BackupPlanRule(
                    rule_name="WeeklyBackup",
                    schedule_expression=events.Schedule.cron(
                        week_day="SUN",
                        hour="1",
                        minute="0"
                    ),
                    start_window=cdk.Duration.hours(1),
                    completion_window=cdk.Duration.hours(3),
                    delete_after=cdk.Duration.days(90)
                )
            ]
        )

        # Add database cluster to backup selection
        backup_plan.add_selection(
            f"DatabaseSelection-{environment_suffix}",
            resources=[
                backup.BackupResource.from_rds_database_cluster(db_cluster)
            ],
            backup_selection_name=f"aurora-backup-{environment_suffix}"
        )

        # Store references
        self.backup_vault = backup_vault
        self.backup_plan = backup_plan
