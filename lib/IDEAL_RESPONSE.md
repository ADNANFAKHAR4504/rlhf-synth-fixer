# Aurora PostgreSQL Migration Infrastructure

Complete Pulumi Python implementation for zero-downtime database migration from on-premises PostgreSQL to AWS Aurora using DMS.

## File: lib/tap_stack.py

```python
"""
Aurora PostgreSQL migration infrastructure using DMS for zero-downtime migration.
"""

import json
from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """Configuration arguments for TapStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: List[str],
        dms_subnet_ids: List[str],
        source_db_host: str,
        source_db_port: int = 5432,
        source_db_name: str = 'postgres',
        source_db_username: str = 'postgres',
        source_db_password: str = '',
        aurora_username: str = 'auroraMaster',
        aurora_password: str = '',
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.dms_subnet_ids = dms_subnet_ids
        self.source_db_host = source_db_host
        self.source_db_port = source_db_port
        self.source_db_name = source_db_name
        self.source_db_username = source_db_username
        self.source_db_password = source_db_password
        self.aurora_username = aurora_username
        self.aurora_password = aurora_password
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """Complete Aurora PostgreSQL migration infrastructure."""

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Environment': self.environment_suffix,
            'MigrationPhase': 'active'
        }
        child_opts = ResourceOptions(parent=self)

        # Secrets Manager
        self.aurora_secret = aws.secretsmanager.Secret(
            f'aurora-credentials-{self.environment_suffix}',
            name=f'aurora-master-credentials-{self.environment_suffix}',
            description='Aurora PostgreSQL master credentials for migration',
            tags=self.tags,
            opts=child_opts
        )

        secret_value = {
            'username': args.aurora_username,
            'password': args.aurora_password,
            'engine': 'postgres',
            'port': 5432
        }

        self.aurora_secret_version = aws.secretsmanager.SecretVersion(
            f'aurora-secret-version-{self.environment_suffix}',
            secret_id=self.aurora_secret.id,
            secret_string=pulumi.Output.secret(json.dumps(secret_value)),
            opts=child_opts
        )

        # Security Groups
        self.aurora_security_group = aws.ec2.SecurityGroup(
            f'aurora-sg-{self.environment_suffix}',
            vpc_id=args.vpc_id,
            description='Security group for Aurora PostgreSQL cluster',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432, to_port=5432, protocol='tcp',
                cidr_blocks=['10.0.0.0/8'], description='PostgreSQL access from VPC'
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0, to_port=0, protocol='-1',
                cidr_blocks=['0.0.0.0/0'], description='Allow all outbound traffic'
            )],
            tags={**self.tags, 'Name': f'aurora-sg-{self.environment_suffix}'},
            opts=child_opts
        )

        self.dms_security_group = aws.ec2.SecurityGroup(
            f'dms-sg-{self.environment_suffix}',
            vpc_id=args.vpc_id,
            description='Security group for DMS replication instance',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432, to_port=5432, protocol='tcp',
                cidr_blocks=['10.0.0.0/8'], description='PostgreSQL access for replication'
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0, to_port=0, protocol='-1',
                cidr_blocks=['0.0.0.0/0'], description='Allow all outbound traffic'
            )],
            tags={**self.tags, 'Name': f'dms-sg-{self.environment_suffix}'},
            opts=child_opts
        )

        self.aurora_dms_ingress = aws.ec2.SecurityGroupRule(
            f'aurora-dms-ingress-{self.environment_suffix}',
            type='ingress', from_port=5432, to_port=5432, protocol='tcp',
            security_group_id=self.aurora_security_group.id,
            source_security_group_id=self.dms_security_group.id,
            description='Allow DMS to connect to Aurora',
            opts=child_opts
        )

        # Aurora Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'aurora-subnet-group-{self.environment_suffix}',
            subnet_ids=args.private_subnet_ids,
            description=f'Subnet group for Aurora cluster {self.environment_suffix}',
            tags=self.tags,
            opts=child_opts
        )

        # Parameter Groups
        self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
            f'aurora-cluster-params-{self.environment_suffix}',
            family='aurora-postgresql15',
            description='Custom parameter group for Aurora PostgreSQL 15 with audit logging',
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(name='log_statement', value='all'),
                aws.rds.ClusterParameterGroupParameterArgs(name='log_min_duration_statement', value='1000'),
                aws.rds.ClusterParameterGroupParameterArgs(name='rds.logical_replication', value='1'),
                aws.rds.ClusterParameterGroupParameterArgs(name='shared_preload_libraries', value='pg_stat_statements')
            ],
            tags=self.tags,
            opts=child_opts
        )

        self.db_parameter_group = aws.rds.ParameterGroup(
            f'aurora-db-params-{self.environment_suffix}',
            family='aurora-postgresql15',
            description='Custom parameter group for Aurora PostgreSQL 15 instances',
            parameters=[
                aws.rds.ParameterGroupParameterArgs(name='log_connections', value='1'),
                aws.rds.ParameterGroupParameterArgs(name='log_disconnections', value='1')
            ],
            tags=self.tags,
            opts=child_opts
        )

        # Aurora Cluster
        self.aurora_cluster = aws.rds.Cluster(
            f'aurora-cluster-{self.environment_suffix}',
            cluster_identifier=f'aurora-postgres-{self.environment_suffix}',
            engine='aurora-postgresql',
            engine_version='15.4',
            database_name='migrationdb',
            master_username=args.aurora_username,
            master_password=args.aurora_password,
            db_subnet_group_name=self.db_subnet_group.name,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            vpc_security_group_ids=[self.aurora_security_group.id],
            backup_retention_period=7,
            preferred_backup_window='03:00-04:00',
            preferred_maintenance_window='mon:04:00-mon:05:00',
            storage_encrypted=True,
            enabled_cloudwatch_logs_exports=['postgresql'],
            skip_final_snapshot=True,
            apply_immediately=True,
            tags=self.tags,
            opts=child_opts
        )

        # Aurora Instances (1 writer + 2 readers)
        self.writer_instance = aws.rds.ClusterInstance(
            f'aurora-writer-{self.environment_suffix}',
            identifier=f'aurora-writer-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.4',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Writer'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        self.reader_instance_1 = aws.rds.ClusterInstance(
            f'aurora-reader-1-{self.environment_suffix}',
            identifier=f'aurora-reader-1-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.4',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Reader'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        self.reader_instance_2 = aws.rds.ClusterInstance(
            f'aurora-reader-2-{self.environment_suffix}',
            identifier=f'aurora-reader-2-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.4',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Reader'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        # DMS Subnet Group
        self.dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            f'dms-subnet-group-{self.environment_suffix}',
            replication_subnet_group_id=f'dms-subnet-group-{self.environment_suffix}',
            replication_subnet_group_description=f'DMS subnet group for {self.environment_suffix}',
            subnet_ids=args.dms_subnet_ids,
            tags=self.tags,
            opts=child_opts
        )

        # DMS IAM Roles
        dms_assume_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=['sts:AssumeRole'],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service', identifiers=['dms.amazonaws.com']
                )]
            )]
        )

        self.dms_vpc_role = aws.iam.Role(
            f'dms-vpc-role-{self.environment_suffix}',
            name=f'dms-vpc-management-role-{self.environment_suffix}',
            assume_role_policy=dms_assume_role_policy.json,
            managed_policy_arns=['arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole'],
            tags=self.tags,
            opts=child_opts
        )

        self.dms_cloudwatch_role = aws.iam.Role(
            f'dms-cloudwatch-role-{self.environment_suffix}',
            name=f'dms-cloudwatch-logs-role-{self.environment_suffix}',
            assume_role_policy=dms_assume_role_policy.json,
            managed_policy_arns=['arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole'],
            tags=self.tags,
            opts=child_opts
        )

        # DMS Replication Instance
        self.dms_replication_instance = aws.dms.ReplicationInstance(
            f'dms-replication-{self.environment_suffix}',
            replication_instance_id=f'dms-replication-{self.environment_suffix}',
            replication_instance_class='dms.c5.2xlarge',
            allocated_storage=100,
            engine_version='3.5.2',
            multi_az=True,
            publicly_accessible=False,
            replication_subnet_group_id=self.dms_subnet_group.id,
            vpc_security_group_ids=[self.dms_security_group.id],
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.dms_vpc_role])
        )

        # DMS Endpoints
        self.dms_source_endpoint = aws.dms.Endpoint(
            f'dms-source-endpoint-{self.environment_suffix}',
            endpoint_id=f'source-postgres-{self.environment_suffix}',
            endpoint_type='source',
            engine_name='postgres',
            server_name=args.source_db_host,
            port=args.source_db_port,
            database_name=args.source_db_name,
            username=args.source_db_username,
            password=args.source_db_password,
            ssl_mode='require',
            tags=self.tags,
            opts=child_opts
        )

        self.dms_target_endpoint = aws.dms.Endpoint(
            f'dms-target-endpoint-{self.environment_suffix}',
            endpoint_id=f'target-aurora-{self.environment_suffix}',
            endpoint_type='target',
            engine_name='aurora-postgresql',
            server_name=self.aurora_cluster.endpoint,
            port=5432,
            database_name='migrationdb',
            username=args.aurora_username,
            password=args.aurora_password,
            ssl_mode='require',
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster, self.writer_instance])
        )

        # DMS Replication Task
        table_mappings = json.dumps({
            'rules': [{
                'rule-type': 'selection',
                'rule-id': '1',
                'rule-name': 'migrate-all-tables',
                'object-locator': {'schema-name': '%', 'table-name': '%'},
                'rule-action': 'include'
            }]
        })

        task_settings = json.dumps({
            'TargetMetadata': {'TargetSchema': '', 'SupportLobs': True, 'FullLobMode': False, 'LobChunkSize': 64, 'LimitedSizeLobMode': True, 'LobMaxSize': 32},
            'FullLoadSettings': {'TargetTablePrepMode': 'DO_NOTHING', 'MaxFullLoadSubTasks': 8, 'TransactionConsistencyTimeout': 600, 'CommitRate': 10000},
            'Logging': {'EnableLogging': True},
            'ChangeProcessingTuning': {'BatchApplyPreserveTransaction': True, 'MemoryLimitTotal': 1024}
        })

        self.dms_replication_task = aws.dms.ReplicationTask(
            f'dms-migration-task-{self.environment_suffix}',
            replication_task_id=f'migration-task-{self.environment_suffix}',
            migration_type='full-load-and-cdc',
            replication_instance_arn=self.dms_replication_instance.replication_instance_arn,
            source_endpoint_arn=self.dms_source_endpoint.endpoint_arn,
            target_endpoint_arn=self.dms_target_endpoint.endpoint_arn,
            table_mappings=table_mappings,
            replication_task_settings=task_settings,
            start_replication_task=False,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.dms_replication_instance, self.dms_source_endpoint, self.dms_target_endpoint])
        )

        # CloudWatch Alarms
        self.aurora_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f'aurora-cpu-alarm-{self.environment_suffix}',
            name=f'aurora-cpu-utilization-{self.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CPUUtilization',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=80,
            alarm_description='Alert when Aurora CPU exceeds 80%',
            dimensions={'DBClusterIdentifier': self.aurora_cluster.cluster_identifier},
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        self.dms_lag_alarm = aws.cloudwatch.MetricAlarm(
            f'dms-replication-lag-alarm-{self.environment_suffix}',
            name=f'dms-replication-lag-{self.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CDCLatencyTarget',
            namespace='AWS/DMS',
            period=300,
            statistic='Average',
            threshold=300,
            alarm_description='Alert when DMS replication lag exceeds 300 seconds',
            dimensions={
                'ReplicationInstanceIdentifier': self.dms_replication_instance.replication_instance_id,
                'ReplicationTaskIdentifier': self.dms_replication_task.replication_task_id
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.dms_replication_instance, self.dms_replication_task])
        )

        # Outputs
        self.cluster_endpoint = self.aurora_cluster.endpoint
        self.reader_endpoint = self.aurora_cluster.reader_endpoint
        self.cluster_id = self.aurora_cluster.id
        self.cluster_arn = self.aurora_cluster.arn
        self.dms_task_arn = self.dms_replication_task.replication_task_arn
        self.secret_arn = self.aurora_secret.arn

        self.register_outputs({
            'cluster_endpoint': self.cluster_endpoint,
            'reader_endpoint': self.reader_endpoint,
            'cluster_arn': self.cluster_arn,
            'dms_task_arn': self.dms_task_arn,
            'secret_arn': self.secret_arn,
            'writer_instance_id': self.writer_instance.id,
            'reader_instance_1_id': self.reader_instance_1.id,
            'reader_instance_2_id': self.reader_instance_2.id,
            'dms_replication_instance_arn': self.dms_replication_instance.replication_instance_arn,
        })
```

## File: tap.py

```python
#!/usr/bin/env python3
"""Pulumi application entry point."""
import os
import pulumi
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

config = Config()
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'

stack = TapStack(
    name='aurora-migration-stack',
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        vpc_id=config.require('vpc_id'),
        private_subnet_ids=config.require_object('private_subnet_ids'),
        dms_subnet_ids=config.require_object('dms_subnet_ids'),
        source_db_host=config.require('source_db_host'),
        source_db_port=config.get_int('source_db_port') or 5432,
        source_db_name=config.get('source_db_name') or 'postgres',
        source_db_username=config.require('source_db_username'),
        source_db_password=config.require_secret('source_db_password'),
        aurora_username=config.get('aurora_username') or 'auroraMaster',
        aurora_password=config.require_secret('aurora_password'),
        tags={'Repository': os.getenv('REPOSITORY', 'iac-test-automations')}
    )
)

pulumi.export('cluster_endpoint', stack.cluster_endpoint)
pulumi.export('reader_endpoint', stack.reader_endpoint)
pulumi.export('dms_task_arn', stack.dms_task_arn)
pulumi.export('secret_arn', stack.secret_arn)
```

## Deployment

```bash
# Configure
pulumi config set aws:region us-east-1
pulumi config set vpc_id vpc-xxxxx
pulumi config set --secret source_db_password <password>
pulumi config set --secret aurora_password <password>

# Deploy
pulumi up

# Start migration
aws dms start-replication-task --replication-task-arn $(pulumi stack output dms_task_arn)
```
