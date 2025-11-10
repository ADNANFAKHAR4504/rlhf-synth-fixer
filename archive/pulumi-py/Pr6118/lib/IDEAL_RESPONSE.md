# Aurora PostgreSQL Migration Infrastructure

Complete Pulumi Python implementation for zero-downtime database migration from on-premises PostgreSQL to AWS Aurora using DMS.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Aurora PostgreSQL migration infrastructure using DMS for zero-downtime migration.
Includes Aurora cluster, DMS replication, Secrets Manager, and CloudWatch monitoring.
"""

import json
from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): Suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        vpc_id (str): ID of the VPC for database deployment.
        private_subnet_ids (List[str]): List of private subnet IDs for Aurora cluster (minimum 2 AZs).
        dms_subnet_ids (List[str]): List of subnet IDs for DMS replication instance.
        source_db_host (str): Hostname/IP of the source on-premises PostgreSQL database.
        source_db_port (int): Port of the source database (default: 5432).
        source_db_name (str): Name of the source database.
        source_db_username (str): Username for source database connection.
        source_db_password (str): Password for source database connection.
        aurora_username (str): Master username for Aurora cluster (default: 'auroraMaster').
        aurora_password (str): Master password for Aurora cluster.
        tags (Optional[dict]): Optional tags to apply to resources.
    """

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
    """
    Complete Aurora PostgreSQL migration infrastructure.

    Creates Aurora cluster, DMS replication infrastructure, Secrets Manager credentials,
    and CloudWatch monitoring for database migration from on-premises to AWS.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Environment': self.environment_suffix,
            'MigrationPhase': 'active'
        }

        child_opts = ResourceOptions(parent=self)

        # ==================== Secrets Manager ====================
        # Store Aurora master credentials
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

        # ==================== Security Groups ====================
        # Security group for Aurora cluster
        self.aurora_security_group = aws.ec2.SecurityGroup(
            f'aurora-sg-{self.environment_suffix}',
            vpc_id=args.vpc_id,
            description='Security group for Aurora PostgreSQL cluster',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/8'],
                    description='PostgreSQL access from VPC'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={**self.tags, 'Name': f'aurora-sg-{self.environment_suffix}'},
            opts=child_opts
        )

        # Security group for DMS replication instance
        self.dms_security_group = aws.ec2.SecurityGroup(
            f'dms-sg-{self.environment_suffix}',
            vpc_id=args.vpc_id,
            description='Security group for DMS replication instance',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol='tcp',
                    cidr_blocks=['10.0.0.0/8'],
                    description='PostgreSQL access for replication'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={**self.tags, 'Name': f'dms-sg-{self.environment_suffix}'},
            opts=child_opts
        )

        # Allow DMS to connect to Aurora
        self.aurora_dms_ingress = aws.ec2.SecurityGroupRule(
            f'aurora-dms-ingress-{self.environment_suffix}',
            type='ingress',
            from_port=5432,
            to_port=5432,
            protocol='tcp',
            security_group_id=self.aurora_security_group.id,
            source_security_group_id=self.dms_security_group.id,
            description='Allow DMS to connect to Aurora',
            opts=child_opts
        )

        # ==================== Aurora Subnet Group ====================
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'aurora-subnet-group-{self.environment_suffix}',
            subnet_ids=args.private_subnet_ids,
            description=f'Subnet group for Aurora cluster {self.environment_suffix}',
            tags=self.tags,
            opts=child_opts
        )

        # ==================== Aurora Parameter Groups ====================
        # Cluster parameter group with audit logging
        self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
            f'aurora-cluster-params-{self.environment_suffix}',
            family='aurora-postgresql15',
            description='Custom parameter group for Aurora PostgreSQL 15 with audit logging',
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='log_statement',
                    value='all',
                    apply_method='pending-reboot'
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='log_min_duration_statement',
                    value='1000',
                    apply_method='immediate'
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='rds.logical_replication',
                    value='1',
                    apply_method='pending-reboot'
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name='shared_preload_libraries',
                    value='pg_stat_statements',
                    apply_method='pending-reboot'
                )
            ],
            tags=self.tags,
            opts=child_opts
        )

        # DB parameter group for instances
        self.db_parameter_group = aws.rds.ParameterGroup(
            f'aurora-db-params-{self.environment_suffix}',
            family='aurora-postgresql15',
            description='Custom parameter group for Aurora PostgreSQL 15 instances',
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name='log_connections',
                    value='1'
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name='log_disconnections',
                    value='1'
                )
            ],
            tags=self.tags,
            opts=child_opts
        )

        # ==================== Aurora Cluster ====================
        self.aurora_cluster = aws.rds.Cluster(
            f'aurora-cluster-{self.environment_suffix}',
            cluster_identifier=f'aurora-postgres-{self.environment_suffix}',
            engine='aurora-postgresql',
            engine_version='15.8',
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

        # ==================== Aurora Cluster Instances ====================
        # Writer instance
        self.writer_instance = aws.rds.ClusterInstance(
            f'aurora-writer-{self.environment_suffix}',
            identifier=f'aurora-writer-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.8',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Writer'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        # Reader instance 1
        self.reader_instance_1 = aws.rds.ClusterInstance(
            f'aurora-reader-1-{self.environment_suffix}',
            identifier=f'aurora-reader-1-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.8',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Reader'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        # Reader instance 2
        self.reader_instance_2 = aws.rds.ClusterInstance(
            f'aurora-reader-2-{self.environment_suffix}',
            identifier=f'aurora-reader-2-{self.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r6g.large',
            engine='aurora-postgresql',
            engine_version='15.8',
            publicly_accessible=False,
            db_subnet_group_name=self.db_subnet_group.name,
            db_parameter_group_name=self.db_parameter_group.name,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**self.tags, 'Role': 'Reader'},
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        # ==================== DMS IAM Roles ====================
        # IAM role for DMS to access VPC resources
        # AWS DMS requires a role named 'dms-vpc-role' for VPC management
        dms_assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=['sts:AssumeRole'],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type='Service',
                            identifiers=['dms.amazonaws.com']
                        )
                    ]
                )
            ]
        )

        # Create the dms-vpc-role that AWS DMS expects
        # Note: This role must be named exactly 'dms-vpc-role'
        self.dms_vpc_role = aws.iam.Role(
            'dms-vpc-role',
            name='dms-vpc-role',
            assume_role_policy=dms_assume_role_policy.json,
            managed_policy_arns=[
                'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole'
            ],
            tags=self.tags,
            opts=ResourceOptions(parent=self, ignore_changes=['name'])
        )

        self.dms_cloudwatch_role = aws.iam.Role(
            f'dms-cloudwatch-role-{self.environment_suffix}',
            name=f'dms-cloudwatch-logs-role-{self.environment_suffix}',
            assume_role_policy=dms_assume_role_policy.json,
            managed_policy_arns=[
                'arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole'
            ],
            tags=self.tags,
            opts=child_opts
        )

        # ==================== DMS Subnet Group ====================
        self.dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            f'dms-subnet-group-{self.environment_suffix}',
            replication_subnet_group_id=f'dms-subnet-group-{self.environment_suffix}',
            replication_subnet_group_description=f'DMS subnet group for {self.environment_suffix}',
            subnet_ids=args.dms_subnet_ids,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.dms_vpc_role])
        )

        # ==================== DMS Replication Instance ====================
        self.dms_replication_instance = aws.dms.ReplicationInstance(
            f'dms-replication-{self.environment_suffix}',
            replication_instance_id=f'dms-replication-{self.environment_suffix}',
            replication_instance_class='dms.c5.2xlarge',
            allocated_storage=100,
            engine_version='3.5.4',
            multi_az=True,
            publicly_accessible=False,
            replication_subnet_group_id=self.dms_subnet_group.id,
            vpc_security_group_ids=[self.dms_security_group.id],
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.dms_vpc_role])
        )

        # ==================== DMS Endpoints ====================
        # Source endpoint (on-premises PostgreSQL)
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

        # Target endpoint (Aurora)
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

        # ==================== DMS Replication Task ====================
        # Table mappings for full migration
        table_mappings = json.dumps({
            'rules': [
                {
                    'rule-type': 'selection',
                    'rule-id': '1',
                    'rule-name': 'migrate-all-tables',
                    'object-locator': {
                        'schema-name': '%',
                        'table-name': '%'
                    },
                    'rule-action': 'include'
                }
            ]
        })

        # Replication task settings
        task_settings = json.dumps({
            'TargetMetadata': {
                'TargetSchema': '',
                'SupportLobs': True,
                'FullLobMode': False,
                'LobChunkSize': 64,
                'LimitedSizeLobMode': True,
                'LobMaxSize': 32
            },
            'FullLoadSettings': {
                'TargetTablePrepMode': 'DO_NOTHING',
                'CreatePkAfterFullLoad': False,
                'StopTaskCachedChangesApplied': False,
                'StopTaskCachedChangesNotApplied': False,
                'MaxFullLoadSubTasks': 8,
                'TransactionConsistencyTimeout': 600,
                'CommitRate': 10000
            },
            'Logging': {
                'EnableLogging': True,
                'LogComponents': [
                    {
                        'Id': 'SOURCE_UNLOAD',
                        'Severity': 'LOGGER_SEVERITY_DEFAULT'
                    },
                    {
                        'Id': 'TARGET_LOAD',
                        'Severity': 'LOGGER_SEVERITY_DEFAULT'
                    },
                    {
                        'Id': 'SOURCE_CAPTURE',
                        'Severity': 'LOGGER_SEVERITY_DEFAULT'
                    },
                    {
                        'Id': 'TARGET_APPLY',
                        'Severity': 'LOGGER_SEVERITY_DEFAULT'
                    }
                ]
            },
            'ChangeProcessingTuning': {
                'BatchApplyPreserveTransaction': True,
                'BatchApplyTimeoutMin': 1,
                'BatchApplyTimeoutMax': 30,
                'BatchApplyMemoryLimit': 500,
                'BatchSplitSize': 0,
                'MinTransactionSize': 1000,
                'CommitTimeout': 1,
                'MemoryLimitTotal': 1024,
                'MemoryKeepTime': 60,
                'StatementCacheSize': 50
            }
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
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    self.dms_replication_instance,
                    self.dms_source_endpoint,
                    self.dms_target_endpoint
                ]
            )
        )

        # ==================== CloudWatch Alarms ====================
        # Aurora CPU utilization alarm
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
            dimensions={
                'DBClusterIdentifier': self.aurora_cluster.cluster_identifier
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.aurora_cluster])
        )

        # DMS replication lag alarm
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
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.dms_replication_instance, self.dms_replication_task]
            )
        )

        # ==================== Outputs ====================
        self.cluster_endpoint = self.aurora_cluster.endpoint
        self.reader_endpoint = self.aurora_cluster.reader_endpoint
        self.cluster_id = self.aurora_cluster.id
        self.cluster_arn = self.aurora_cluster.arn
        self.dms_task_arn = self.dms_replication_task.replication_task_arn
        self.secret_arn = self.aurora_secret.arn

        self.register_outputs({
            'cluster_endpoint': self.cluster_endpoint,
            'reader_endpoint': self.reader_endpoint,
            'cluster_id': self.cluster_id,
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
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions, Output
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Get configuration values from Pulumi config with defaults
vpc_id = config.get('vpc_id')
private_subnet_ids = config.get_object('private_subnet_ids')
dms_subnet_ids = config.get_object('dms_subnet_ids')

# Create VPC and subnets if not provided
if not vpc_id:
    # Create VPC
    vpc = aws.ec2.Vpc(
        f'tap-vpc-{environment_suffix}',
        cidr_block='10.0.0.0/16',
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**default_tags, 'Name': f'tap-vpc-{environment_suffix}'}
    )
    vpc_id = vpc.id
    
    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f'tap-igw-{environment_suffix}',
        vpc_id=vpc.id,
        tags={**default_tags, 'Name': f'tap-igw-{environment_suffix}'}
    )
    
    # Get availability zones
    azs = aws.get_availability_zones(state="available")
    
    # Create subnets in multiple AZs (need at least 2 for Aurora)
    private_subnets = []
    for i in range(3):
        subnet = aws.ec2.Subnet(
            f'tap-private-subnet-{i}-{environment_suffix}',
            vpc_id=vpc.id,
            cidr_block=f'10.0.{i}.0/24',
            availability_zone=azs.names[i],
            map_public_ip_on_launch=False,
            tags={**default_tags, 'Name': f'tap-private-subnet-{i}-{environment_suffix}'}
        )
        private_subnets.append(subnet.id)
    
    # Use same subnets for both Aurora and DMS if not specified
    if not private_subnet_ids:
        private_subnet_ids = private_subnets
    if not dms_subnet_ids:
        dms_subnet_ids = private_subnets

source_db_host = config.get('source_db_host') or '10.0.1.100'
source_db_port = config.get_int('source_db_port') or 5432
source_db_name = config.get('source_db_name') or 'postgres'
source_db_username = config.get('source_db_username') or 'postgres'
source_db_password = config.get_secret('source_db_password') or 'SourceDbPassword123!'
aurora_username = config.get('aurora_username') or 'auroraMaster'
aurora_password = config.get_secret('aurora_password') or 'AuroraPassword123!'

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        vpc_id=vpc_id,
        private_subnet_ids=private_subnet_ids,
        dms_subnet_ids=dms_subnet_ids,
        source_db_host=source_db_host,
        source_db_port=source_db_port,
        source_db_name=source_db_name,
        source_db_username=source_db_username,
        source_db_password=source_db_password,
        aurora_username=aurora_username,
        aurora_password=aurora_password,
        tags=default_tags,
    ),
)

# Export key outputs
pulumi.export('cluster_endpoint', stack.cluster_endpoint)
pulumi.export('reader_endpoint', stack.reader_endpoint)
pulumi.export('cluster_arn', stack.cluster_arn)
pulumi.export('dms_task_arn', stack.dms_task_arn)
pulumi.export('secret_arn', stack.secret_arn)
pulumi.export('vpc_id', vpc_id)
```

## Deployment

```bash
# The infrastructure automatically creates VPC and subnets when not configured
# Optional: Set custom configuration
pulumi config set aws:region us-east-1
pulumi config set vpc_id vpc-xxxxx  # Optional
pulumi config set --secret source_db_password <password>  # Optional, has default
pulumi config set --secret aurora_password <password>  # Optional, has default

# Deploy
pulumi up

# Infrastructure deployed successfully with all resources created
```
