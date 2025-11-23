"""monitoring_stack.py
CloudWatch dashboards and EventBridge monitoring.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cw_actions
from aws_cdk import aws_rds as rds
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_sns as sns
from constructs import Construct


class MonitoringStackProps:
    """Properties for Monitoring stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_cluster: rds.IDatabaseCluster,
        table: dynamodb.ITableV2,
        backup_vault_name: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_cluster = primary_cluster
        self.table = table
        self.backup_vault_name = backup_vault_name


class MonitoringStack(Construct):
    """Creates CloudWatch dashboards and EventBridge monitoring."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: MonitoringStackProps
    ):
        super().__init__(scope, construct_id)

        # Create SNS topic for alerts
        alert_topic = sns.Topic(
            self,
            f'AlertTopic{props.environment_suffix}',
            topic_name=f'dr-alerts-{props.environment_suffix}',
            display_name='Disaster Recovery Alerts'
        )

        # Create CloudWatch dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            f'DRDashboard{props.environment_suffix}',
            dashboard_name=f'dr-monitoring-{props.environment_suffix}'
        )

        # Add Aurora replication lag widget
        aurora_replication_widget = cloudwatch.GraphWidget(
            title='Aurora Replication Lag',
            left=[
                cloudwatch.Metric(
                    namespace='AWS/RDS',
                    metric_name='AuroraGlobalDBReplicationLag',
                    dimensions_map={
                        'DBClusterIdentifier': props.primary_cluster.cluster_identifier
                    },
                    statistic='Average',
                    period=cdk.Duration.minutes(1)
                )
            ]
        )

        # Add DynamoDB replication latency widget
        dynamodb_replication_widget = cloudwatch.GraphWidget(
            title='DynamoDB Replication Latency',
            left=[
                cloudwatch.Metric(
                    namespace='AWS/DynamoDB',
                    metric_name='ReplicationLatency',
                    dimensions_map={
                        'TableName': props.table.table_name,
                        'ReceivingRegion': 'us-west-2'
                    },
                    statistic='Average',
                    period=cdk.Duration.minutes(1)
                )
            ]
        )

        # Add backup job status widget
        backup_widget = cloudwatch.GraphWidget(
            title='Backup Job Status',
            left=[
                cloudwatch.Metric(
                    namespace='AWS/Backup',
                    metric_name='NumberOfBackupJobsCompleted',
                    dimensions_map={
                        'BackupVaultName': props.backup_vault_name
                    },
                    statistic='Sum',
                    period=cdk.Duration.hours(1)
                ),
                cloudwatch.Metric(
                    namespace='AWS/Backup',
                    metric_name='NumberOfBackupJobsFailed',
                    dimensions_map={
                        'BackupVaultName': props.backup_vault_name
                    },
                    statistic='Sum',
                    period=cdk.Duration.hours(1)
                )
            ]
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            aurora_replication_widget,
            dynamodb_replication_widget,
            backup_widget
        )

        # Create alarm for high replication lag
        replication_lag_alarm = cloudwatch.Alarm(
            self,
            f'ReplicationLagAlarm{props.environment_suffix}',
            metric=cloudwatch.Metric(
                namespace='AWS/RDS',
                metric_name='AuroraGlobalDBReplicationLag',
                dimensions_map={
                    'DBClusterIdentifier': props.primary_cluster.cluster_identifier
                },
                statistic='Average',
                period=cdk.Duration.minutes(5)
            ),
            threshold=60000,  # 60 seconds in milliseconds
            evaluation_periods=2,
            alarm_description='Alert when Aurora replication lag exceeds 60 seconds',
            alarm_name=f'dr-replication-lag-alarm-{props.environment_suffix}'
        )

        replication_lag_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )

        # Create EventBridge rule for backup failures (already in backup_stack, but adding here for completeness)
        backup_failure_rule = events.Rule(
            self,
            f'BackupFailureMonitoring{props.environment_suffix}',
            event_pattern=events.EventPattern(
                source=['aws.backup'],
                detail_type=['Copy Job State Change'],
                detail={
                    'state': ['FAILED']
                }
            ),
            description='Monitor cross-region backup copy failures'
        )

        backup_failure_rule.add_target(targets.SnsTopic(alert_topic))

        # Tags
        cdk.Tags.of(self.dashboard).add('DR-Role', 'Monitoring-Dashboard')

        # Outputs
        cdk.CfnOutput(
            self,
            'DashboardUrl',
            value=f'https://console.aws.amazon.com/cloudwatch/home?region={cdk.Aws.REGION}#dashboards:name={self.dashboard.dashboard_name}',
            description='CloudWatch dashboard URL'
        )
        cdk.CfnOutput(
            self,
            'AlertTopicArn',
            value=alert_topic.topic_arn,
            description='SNS topic ARN for monitoring alerts'
        )