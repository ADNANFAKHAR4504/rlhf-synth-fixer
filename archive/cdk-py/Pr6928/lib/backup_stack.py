"""backup_stack.py
AWS Backup configuration with cross-region copy.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_backup as backup
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_sns as sns
from aws_cdk import aws_iam as iam
from constructs import Construct


class BackupStackProps:
    """Properties for Backup stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        aurora_cluster_arn: str,
        dynamodb_table_arn: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.aurora_cluster_arn = aurora_cluster_arn
        self.dynamodb_table_arn = dynamodb_table_arn


class BackupStack(Construct):
    """Creates AWS Backup plan with cross-region copy."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: BackupStackProps
    ):
        super().__init__(scope, construct_id)

        # Create backup vault in primary region
        primary_vault = backup.BackupVault(
            self,
            f'PrimaryBackupVault{props.environment_suffix}',
            backup_vault_name=f'dr-backup-vault-primary-{props.environment_suffix}',
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create backup vault in secondary region for cross-region copy
        secondary_vault = backup.BackupVault(
            self,
            f'SecondaryBackupVault{props.environment_suffix}',
            backup_vault_name=f'dr-backup-vault-secondary-{props.environment_suffix}',
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create SNS topic for backup notifications
        backup_topic = sns.Topic(
            self,
            f'BackupNotificationTopic{props.environment_suffix}',
            topic_name=f'dr-backup-notifications-{props.environment_suffix}',
            display_name='Disaster Recovery Backup Notifications'
        )

        # Create backup plan with 1-hour RPO
        self.backup_plan = backup.BackupPlan(
            self,
            f'BackupPlan{props.environment_suffix}',
            backup_plan_name=f'dr-backup-plan-{props.environment_suffix}',
            backup_vault=primary_vault
        )

        # Add hourly backup rule
        self.backup_plan.add_rule(
            backup.BackupPlanRule(
                backup_vault=primary_vault,
                rule_name='HourlyBackupRule',
                schedule_expression=events.Schedule.cron(
                    minute='0',
                    hour='*',
                    month='*',
                    week_day='*',
                    year='*'
                ),
                start_window=cdk.Duration.hours(1),
                completion_window=cdk.Duration.hours(2),
                delete_after=cdk.Duration.days(7),
                copy_actions=[
                    backup.BackupPlanCopyActionProps(
                        destination_backup_vault=secondary_vault,
                        delete_after=cdk.Duration.days(14)
                    )
                ]
            )
        )

        # Create backup selection for Aurora
        self.backup_plan.add_selection(
            f'AuroraSelection{props.environment_suffix}',
            resources=[
                backup.BackupResource.from_arn(props.aurora_cluster_arn)
            ]
        )

        # Create backup selection for DynamoDB
        self.backup_plan.add_selection(
            f'DynamoDBSelection{props.environment_suffix}',
            resources=[
                backup.BackupResource.from_arn(props.dynamodb_table_arn)
            ]
        )

        # Create EventBridge rule to monitor backup job failures
        backup_failed_rule = events.Rule(
            self,
            f'BackupFailedRule{props.environment_suffix}',
            event_pattern=events.EventPattern(
                source=['aws.backup'],
                detail_type=['Backup Job State Change'],
                detail={
                    'state': ['FAILED', 'ABORTED']
                }
            ),
            description='Monitor AWS Backup job failures'
        )

        backup_failed_rule.add_target(targets.SnsTopic(backup_topic))

        # Create EventBridge rule to monitor backup job completions
        backup_completed_rule = events.Rule(
            self,
            f'BackupCompletedRule{props.environment_suffix}',
            event_pattern=events.EventPattern(
                source=['aws.backup'],
                detail_type=['Backup Job State Change'],
                detail={
                    'state': ['COMPLETED']
                }
            ),
            description='Monitor AWS Backup job completions'
        )

        backup_completed_rule.add_target(targets.SnsTopic(backup_topic))

        # Tags
        cdk.Tags.of(self.backup_plan).add('DR-Role', 'Backup-Plan')
        cdk.Tags.of(primary_vault).add('DR-Role', 'Primary-Backup-Vault')
        cdk.Tags.of(secondary_vault).add('DR-Role', 'Secondary-Backup-Vault')

        # Outputs
        cdk.CfnOutput(
            self,
            'BackupPlanId',
            value=self.backup_plan.backup_plan_id,
            description='Backup plan ID'
        )
        cdk.CfnOutput(
            self,
            'BackupTopicArn',
            value=backup_topic.topic_arn,
            description='SNS topic ARN for backup notifications'
        )