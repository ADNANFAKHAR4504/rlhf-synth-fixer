"""
global_resources.py

Global cross-region resources for disaster recovery.
Includes Route 53, DynamoDB global table, CloudWatch monitoring, and S3 replication.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class GlobalResourcesArgs:
    """Arguments for global resources."""
    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        dr_region: str,
        primary_api_endpoint: Output[str],
        dr_api_endpoint: Output[str],
        primary_bucket_name: Output[str],
        primary_bucket_arn: Output[str],
        dr_bucket_name: Output[str],
        dr_bucket_arn: Output[str],
        replication_role_arn: Output[str],
        aurora_primary_cluster_id: Output[str],
        aurora_dr_cluster_id: Output[str],
        primary_sns_topic_arn: Output[str],
        dr_sns_topic_arn: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.dr_region = dr_region
        self.primary_api_endpoint = primary_api_endpoint
        self.dr_api_endpoint = dr_api_endpoint
        self.primary_bucket_name = primary_bucket_name
        self.primary_bucket_arn = primary_bucket_arn
        self.dr_bucket_name = dr_bucket_name
        self.dr_bucket_arn = dr_bucket_arn
        self.replication_role_arn = replication_role_arn
        self.aurora_primary_cluster_id = aurora_primary_cluster_id
        self.aurora_dr_cluster_id = aurora_dr_cluster_id
        self.primary_sns_topic_arn = primary_sns_topic_arn
        self.dr_sns_topic_arn = dr_sns_topic_arn
        self.tags = tags or {}


class GlobalResources(pulumi.ComponentResource):
    """
    Global cross-region resources for disaster recovery.

    Creates Route 53, DynamoDB global table, CloudWatch monitoring,
    and S3 cross-region replication configuration.
    """

    def __init__(
        self,
        name: str,
        args: GlobalResourcesArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dr:GlobalResources', name, None, opts)

        # Providers for both regions
        self.primary_provider = aws.Provider(
            f'global-primary-provider-{args.environment_suffix}',
            region=args.primary_region,
            opts=ResourceOptions(parent=self)
        )

        self.dr_provider = aws.Provider(
            f'global-dr-provider-{args.environment_suffix}',
            region=args.dr_region,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB global table
        self._create_dynamodb_global_table(args)

        # Route 53 hosted zone and health checks
        self._create_route53_resources(args)

        # S3 cross-region replication
        self._create_s3_replication(args)

        # CloudWatch dashboards and alarms
        self._create_cloudwatch_monitoring(args)

        self.register_outputs({})

    def _create_dynamodb_global_table(self, args: GlobalResourcesArgs):
        """Create DynamoDB global table with point-in-time recovery."""
        # Primary region table
        self.dynamodb_table_primary = aws.dynamodb.Table(
            f'payment-transactions-primary-{args.environment_suffix}',
            name=f'payment-transactions-{args.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='payment_id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='payment_id',
                    type='S'
                )
            ],
            stream_enabled=True,
            stream_view_type='NEW_AND_OLD_IMAGES',
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={**args.tags, 'Name': f'payment-transactions-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # DR region replica
        self.dynamodb_replica = aws.dynamodb.TableReplica(
            f'payment-transactions-dr-replica-{args.environment_suffix}',
            global_table_arn=self.dynamodb_table_primary.arn,
            point_in_time_recovery=True,
            tags={**args.tags, 'Name': f'payment-transactions-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.dr_provider)
        )

        self.dynamodb_table_name = self.dynamodb_table_primary.name
        self.dynamodb_table_arn = self.dynamodb_table_primary.arn

    def _create_route53_resources(self, args: GlobalResourcesArgs):
        """Create Route 53 health checks for monitoring (no custom domain)."""
        # Health check for primary region API Gateway
        self.primary_health_check = aws.route53.HealthCheck(
            f'health-check-primary-{args.environment_suffix}',
            type='HTTPS',
            resource_path='/prod/payment',
            fqdn=args.primary_api_endpoint.apply(
                lambda endpoint: endpoint.replace('https://', '').split('/')[0]
            ),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={**args.tags, 'Name': f'health-check-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Health check for DR region API Gateway
        self.dr_health_check = aws.route53.HealthCheck(
            f'health-check-dr-{args.environment_suffix}',
            type='HTTPS',
            resource_path='/prod/payment',
            fqdn=args.dr_api_endpoint.apply(
                lambda endpoint: endpoint.replace('https://', '').split('/')[0]
            ),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={**args.tags, 'Name': f'health-check-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Store endpoints for output (no custom domain, use API Gateway endpoints directly)
        self.hosted_zone_id = None
        self.route53_fqdn = pulumi.Output.concat(
            'Use API Gateway endpoints directly: Primary=',
            args.primary_api_endpoint,
            ', DR=',
            args.dr_api_endpoint
        )

    def _create_s3_replication(self, args: GlobalResourcesArgs):
        """Configure S3 cross-region replication."""
        # S3 replication policy for the role
        replication_policy = aws.iam.RolePolicy(
            f's3-replication-policy-{args.environment_suffix}',
            role=args.replication_role_arn.apply(lambda arn: arn.split('/')[-1]),
            policy=pulumi.Output.all(
                args.primary_bucket_arn,
                args.dr_bucket_arn
            ).apply(lambda arns: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetReplicationConfiguration',
                            's3:ListBucket'
                        ],
                        'Resource': arns[0]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetObjectVersionForReplication',
                            's3:GetObjectVersionAcl',
                            's3:GetObjectVersionTagging'
                        ],
                        'Resource': f'{arns[0]}/*'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:ReplicateObject',
                            's3:ReplicateDelete',
                            's3:ReplicateTags'
                        ],
                        'Resource': f'{arns[1]}/*'
                    }
                ]
            })),
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # S3 replication configuration
        self.s3_replication = aws.s3.BucketReplicationConfig(
            f's3-replication-config-{args.environment_suffix}',
            bucket=args.primary_bucket_name,
            role=args.replication_role_arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id=f'replicate-all-{args.environment_suffix}',
                status='Enabled',
                priority=1,
                delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                    status='Enabled'
                ),
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(
                    prefix=''
                ),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=args.dr_bucket_arn,
                    storage_class='STANDARD',
                    replication_time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeArgs(
                        status='Enabled',
                        time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeTimeArgs(
                            minutes=15
                        )
                    ),
                    metrics=aws.s3.BucketReplicationConfigRuleDestinationMetricsArgs(
                        status='Enabled',
                        event_threshold=aws.s3.BucketReplicationConfigRuleDestinationMetricsEventThresholdArgs(
                            minutes=15
                        )
                    )
                )
            )],
            opts=ResourceOptions(
                parent=self,
                provider=self.primary_provider,
                depends_on=[replication_policy]
            )
        )

    def _create_cloudwatch_monitoring(self, args: GlobalResourcesArgs):
        """Create CloudWatch dashboards and alarms in both regions."""
        # Primary region dashboard
        self.primary_dashboard = aws.cloudwatch.Dashboard(
            f'dr-dashboard-primary-{args.environment_suffix}',
            dashboard_name=f'dr-dashboard-primary-{args.environment_suffix}',
            dashboard_body=pulumi.Output.all(
                args.aurora_primary_cluster_id,
                args.primary_bucket_name,
                args.environment_suffix
            ).apply(lambda values: json.dumps({
                'widgets': [
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/RDS', 'AuroraGlobalDBReplicationLag', {'stat': 'Average'}]
                            ],
                            'period': 300,
                            'stat': 'Average',
                            'region': args.primary_region,
                            'title': 'Aurora Replication Lag',
                            'yAxis': {'left': {'min': 0}}
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/S3', 'ReplicationLatency', {'stat': 'Average'}]
                            ],
                            'period': 300,
                            'stat': 'Average',
                            'region': args.primary_region,
                            'title': 'S3 Replication Latency'
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/ApiGateway', '4XXError', {'stat': 'Sum'}],
                                ['.', '5XXError', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.primary_region,
                            'title': 'API Gateway Errors'
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/Lambda', 'Errors', {'stat': 'Sum'}],
                                ['.', 'Throttles', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.primary_region,
                            'title': 'Lambda Errors and Throttles'
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # DR region dashboard
        self.dr_dashboard = aws.cloudwatch.Dashboard(
            f'dr-dashboard-dr-{args.environment_suffix}',
            dashboard_name=f'dr-dashboard-dr-{args.environment_suffix}',
            dashboard_body=pulumi.Output.all(
                args.aurora_dr_cluster_id,
                args.dr_bucket_name,
                args.environment_suffix
            ).apply(lambda values: json.dumps({
                'widgets': [
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/RDS', 'AuroraGlobalDBReplicatedWriteIO', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.dr_region,
                            'title': 'Aurora Replicated Write IO',
                            'yAxis': {'left': {'min': 0}}
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/S3', 'BytesDownloaded', {'stat': 'Sum'}],
                                ['.', 'BytesUploaded', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.dr_region,
                            'title': 'S3 Data Transfer'
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/ApiGateway', '4XXError', {'stat': 'Sum'}],
                                ['.', '5XXError', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.dr_region,
                            'title': 'API Gateway Errors'
                        }
                    },
                    {
                        'type': 'metric',
                        'properties': {
                            'metrics': [
                                ['AWS/Lambda', 'Errors', {'stat': 'Sum'}],
                                ['.', 'Throttles', {'stat': 'Sum'}]
                            ],
                            'period': 300,
                            'stat': 'Sum',
                            'region': args.dr_region,
                            'title': 'Lambda Errors and Throttles'
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self, provider=self.dr_provider)
        )

        # CloudWatch alarm for Aurora replication lag > 1 second
        self.replication_lag_alarm = aws.cloudwatch.MetricAlarm(
            f'aurora-replication-lag-alarm-{args.environment_suffix}',
            name=f'aurora-replication-lag-alarm-{args.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='AuroraGlobalDBReplicationLag',
            namespace='AWS/RDS',
            period=60,
            statistic='Average',
            threshold=1000,  # 1 second in milliseconds
            alarm_description='Alert when Aurora replication lag exceeds 1 second',
            alarm_actions=[args.primary_sns_topic_arn],
            tags={**args.tags, 'Name': f'aurora-replication-lag-alarm-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # CloudWatch alarm for primary health check
        self.primary_health_alarm = aws.cloudwatch.MetricAlarm(
            f'route53-primary-health-alarm-{args.environment_suffix}',
            name=f'route53-primary-health-alarm-{args.environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=2,
            metric_name='HealthCheckStatus',
            namespace='AWS/Route53',
            period=60,
            statistic='Minimum',
            threshold=1,
            alarm_description='Alert when primary region health check fails',
            alarm_actions=[args.primary_sns_topic_arn],
            dimensions={
                'HealthCheckId': self.primary_health_check.id
            },
            tags={**args.tags, 'Name': f'route53-primary-health-alarm-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # CloudWatch alarm for DR health check
        self.dr_health_alarm = aws.cloudwatch.MetricAlarm(
            f'route53-dr-health-alarm-{args.environment_suffix}',
            name=f'route53-dr-health-alarm-{args.environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=2,
            metric_name='HealthCheckStatus',
            namespace='AWS/Route53',
            period=60,
            statistic='Minimum',
            threshold=1,
            alarm_description='Alert when DR region health check fails',
            alarm_actions=[args.dr_sns_topic_arn],
            dimensions={
                'HealthCheckId': self.dr_health_check.id
            },
            tags={**args.tags, 'Name': f'route53-dr-health-alarm-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.dr_provider)
        )
