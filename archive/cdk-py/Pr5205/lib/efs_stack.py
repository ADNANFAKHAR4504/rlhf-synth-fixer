"""
EFS Stack for Disaster Recovery Infrastructure

This module creates an EFS file system for transaction logs:
- Multi-AZ EFS file system
- Encryption at rest and in transit
- Mount targets in multiple availability zones
- Lifecycle policies for cost optimization
- Backup policies for data protection
"""

from aws_cdk import (
    aws_efs as efs,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_backup as backup,
    aws_events as events,
    CfnOutput,
    NestedStack,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class EFSStack(NestedStack):
    """
    Creates an EFS file system for storing transaction logs
    """

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        kms_key: kms.Key,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create EFS file system
        self.file_system = efs.FileSystem(
            self,
            f"TransactionLogsEFS-{environment_suffix}",
            vpc=vpc,
            file_system_name=f"dr-transaction-logs-{environment_suffix}",
            encrypted=True,
            kms_key=kms_key,
            enable_automatic_backups=True,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_7_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            removal_policy=RemovalPolicy.DESTROY,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        # Create access point for application access
        self.access_point = efs.AccessPoint(
            self,
            f"TransactionLogsAccessPoint-{environment_suffix}",
            file_system=self.file_system,
            path="/transaction-logs",
            create_acl=efs.Acl(
                owner_uid="1000",
                owner_gid="1000",
                permissions="755",
            ),
            posix_user=efs.PosixUser(
                uid="1000",
                gid="1000",
            ),
        )

        # Create backup plan for EFS
        backup_plan = backup.BackupPlan(
            self,
            f"EFSBackupPlan-{environment_suffix}",
            backup_plan_name=f"dr-efs-backup-{environment_suffix}",
            backup_plan_rules=[
                backup.BackupPlanRule(
                    backup_vault=backup.BackupVault(
                        self,
                        f"EFSBackupVault-{environment_suffix}",
                        backup_vault_name=f"dr-efs-vault-{environment_suffix}",
                        removal_policy=RemovalPolicy.DESTROY,
                    ),
                    rule_name="DailyBackup",
                    schedule_expression=events.Schedule.cron(
                        hour="2",
                        minute="0",
                    ),
                    delete_after=Duration.days(7),
                ),
            ],
        )

        # Add EFS to backup plan
        backup_plan.add_selection(
            f"EFSBackupSelection-{environment_suffix}",
            resources=[
                backup.BackupResource.from_efs_file_system(self.file_system)
            ],
        )

        # Outputs
        CfnOutput(
            self,
            "FileSystemId",
            value=self.file_system.file_system_id,
            description="EFS File System ID",
            export_name=f"efs-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FileSystemArn",
            value=self.file_system.file_system_arn,
            description="EFS File System ARN",
            export_name=f"efs-arn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "AccessPointId",
            value=self.access_point.access_point_id,
            description="EFS Access Point ID",
            export_name=f"efs-access-point-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "AccessPointArn",
            value=self.access_point.access_point_arn,
            description="EFS Access Point ARN",
            export_name=f"efs-access-point-arn-{environment_suffix}",
        )
