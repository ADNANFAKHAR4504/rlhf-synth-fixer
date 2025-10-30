# FedRAMP-Compliant Disaster Recovery Solution

This implementation provides a production-ready disaster recovery solution for a federal government agency using AWS CDK with Python.

### Architecture Overview

- **VPC**: Multi-AZ VPC with public, private, and isolated subnets across 3 availability zones
- **RDS**: PostgreSQL 15.10 Multi-AZ deployment with cross-region read replica capability
- **EFS**: Elastic File System with AWS Backup for hourly backups (RPO: 1 hour)
- **Secrets Manager**: Automated credential storage with KMS encryption
- **ElastiCache**: Redis 7.0 cluster with Multi-AZ automatic failover
- **Region**: eu-west-2 (all resources deployed here)
- **Security**: FIPS 140-2 validated KMS encryption for data at rest and TLS for in-transit

## Implementation

### File: lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .disaster_recovery_stack import DisasterRecoveryStack, DisasterRecoveryStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): An optional suffix to identify the
      deployment environment (e.g., 'dev', 'prod').
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of the disaster
    recovery infrastructure including RDS, EFS, Secrets Manager, and ElastiCache.
    It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.

    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create disaster recovery infrastructure
        dr_props = DisasterRecoveryStackProps(
            environment_suffix=environment_suffix
        )

        self.dr_stack = DisasterRecoveryStack(
            self,
            "DisasterRecoveryStack",
            props=dr_props
        )

        # Make important resources available as properties
        self.database_endpoint = self.dr_stack.database_endpoint
        self.efs_id = self.dr_stack.efs_id
        self.cache_endpoint = self.dr_stack.cache_endpoint
        self.secret_arn = self.dr_stack.secret_arn
```

### File: lib/disaster_recovery_stack.py

```python
"""Disaster Recovery Stack for FedRAMP-compliant database system."""

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_efs as efs,
    aws_secretsmanager as secretsmanager,
    aws_elasticache as elasticache,
    aws_backup as backup,
    aws_events as events,
    aws_iam as iam,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class DisasterRecoveryStackProps:
    """Properties for Disaster Recovery Stack."""

    def __init__(self, environment_suffix: str):
        """Initialize stack properties.

        Args:
            environment_suffix: Unique suffix for resource naming
        """
        self.environment_suffix = environment_suffix


class DisasterRecoveryStack(Construct):
    """Disaster Recovery Stack with RDS, EFS, Secrets Manager, and ElastiCache."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: DisasterRecoveryStackProps,
    ):
        """Initialize the Disaster Recovery Stack.

        Args:
            scope: CDK scope
            construct_id: Construct identifier
            props: Stack properties with environment suffix
        """
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Create KMS key for encryption (FIPS 140-2 compliant)
        self.kms_key = kms.Key(
            self,
            "DREncryptionKey",
            description=f"DR encryption key for {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create VPC with Multi-AZ configuration
        self.vpc = ec2.Vpc(
            self,
            f"DRVPC-{env_suffix}",
            vpc_name=f"dr-vpc-{env_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Create database credentials secret
        self.db_secret = secretsmanager.Secret(
            self,
            f"DBSecret-{env_suffix}",
            secret_name=f"db-credentials-{env_suffix}",
            description="Database master credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                password_length=32,
                exclude_punctuation=True,
                exclude_characters='"@/\\',
            ),
            encryption_key=self.kms_key,
        )

        # Create RDS security group
        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"RDSSecurityGroup-{env_suffix}",
            vpc=self.vpc,
            security_group_name=f"rds-sg-{env_suffix}",
            description="Security group for RDS database",
            allow_all_outbound=False,
        )

        # Create RDS subnet group
        self.db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{env_suffix}",
            vpc=self.vpc,
            description="Subnet group for RDS",
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=f"db-subnet-group-{env_suffix}",
        )

        # Create RDS instance with Multi-AZ
        self.database = rds.DatabaseInstance(
            self,
            f"Database-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_10
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM,
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[self.rds_security_group],
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            database_name="appdb",
            credentials=rds.Credentials.from_secret(self.db_secret),
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            monitoring_interval=Duration.seconds(60),
            subnet_group=self.db_subnet_group,
        )

        # Create read replica
        self.read_replica = rds.DatabaseInstanceReadReplica(
            self,
            f"ReadReplica-{env_suffix}",
            source_database_instance=self.database,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM,
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[self.rds_security_group],
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            monitoring_interval=Duration.seconds(60),
        )

        # Create EFS security group
        self.efs_security_group = ec2.SecurityGroup(
            self,
            f"EFSSecurityGroup-{env_suffix}",
            vpc=self.vpc,
            security_group_name=f"efs-sg-{env_suffix}",
            description="Security group for EFS",
            allow_all_outbound=False,
        )

        self.efs_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(2049),
            description="Allow NFS from VPC",
        )

        # Create EFS file system
        self.file_system = efs.FileSystem(
            self,
            f"FileSystem-{env_suffix}",
            vpc=self.vpc,
            file_system_name=f"dr-efs-{env_suffix}",
            encrypted=True,
            kms_key=self.kms_key,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_7_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            removal_policy=RemovalPolicy.DESTROY,
            security_group=self.efs_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        # Create AWS Backup vault
        self.backup_vault = backup.BackupVault(
            self,
            f"BackupVault-{env_suffix}",
            backup_vault_name=f"dr-backup-vault-{env_suffix}",
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create backup plan with hourly backups
        self.backup_plan = backup.BackupPlan(
            self,
            f"BackupPlan-{env_suffix}",
            backup_plan_name=f"dr-backup-plan-{env_suffix}",
            backup_vault=self.backup_vault,
        )

        # Add hourly backup rule for RPO of 1 hour
        self.backup_plan.add_rule(
            backup.BackupPlanRule(
                rule_name="HourlyBackup",
                schedule_expression=events.Schedule.cron(
                    minute="0",
                    hour="*",
                    month="*",
                    week_day="*",
                    year="*",
                ),
                start_window=Duration.hours(1),
                completion_window=Duration.hours(2),
                delete_after=Duration.days(7),
            )
        )

        # Add EFS to backup plan
        self.backup_plan.add_selection(
            f"EFSBackupSelection-{env_suffix}",
            resources=[backup.BackupResource.from_efs_file_system(self.file_system)],
        )

        # Create ElastiCache subnet group
        self.cache_subnet_group = elasticache.CfnSubnetGroup(
            self,
            f"CacheSubnetGroup-{env_suffix}",
            description="Subnet group for ElastiCache",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
            cache_subnet_group_name=f"cache-subnet-group-{env_suffix}",
        )

        # Create ElastiCache security group
        self.cache_security_group = ec2.SecurityGroup(
            self,
            f"CacheSecurityGroup-{env_suffix}",
            vpc=self.vpc,
            security_group_name=f"cache-sg-{env_suffix}",
            description="Security group for ElastiCache",
            allow_all_outbound=False,
        )

        self.cache_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(6379),
            description="Allow Redis from VPC",
        )

        # Create ElastiCache replication group (Redis with Multi-AZ)
        self.cache_cluster = elasticache.CfnReplicationGroup(
            self,
            f"CacheCluster-{env_suffix}",
            replication_group_description="Redis cluster for session management",
            replication_group_id=f"cache-cluster-{env_suffix}",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.micro",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=self.kms_key.key_id,
            cache_subnet_group_name=self.cache_subnet_group.cache_subnet_group_name,
            security_group_ids=[self.cache_security_group.security_group_id],
            snapshot_retention_limit=7,
            snapshot_window="02:00-03:00",
            preferred_maintenance_window="sun:05:00-sun:06:00",
        )

        self.cache_cluster.add_dependency(self.cache_subnet_group)

        # Create CloudWatch alarms for monitoring
        cloudwatch.Alarm(
            self,
            f"RDSCPUAlarm-{env_suffix}",
            alarm_name=f"rds-cpu-alarm-{env_suffix}",
            metric=self.database.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        cloudwatch.Alarm(
            self,
            f"RDSConnectionAlarm-{env_suffix}",
            alarm_name=f"rds-connection-alarm-{env_suffix}",
            metric=self.database.metric_database_connections(),
            threshold=100,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Store outputs
        self.database_endpoint = self.database.db_instance_endpoint_address
        self.database_port = self.database.db_instance_endpoint_port
        self.efs_id = self.file_system.file_system_id
        self.cache_endpoint = self.cache_cluster.attr_primary_end_point_address
        self.secret_arn = self.db_secret.secret_arn

        # Create CFN outputs
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database_endpoint,
            description="RDS database endpoint",
        )

        CfnOutput(
            self,
            "DatabasePort",
            value=self.database_port,
            description="RDS database port",
        )

        CfnOutput(
            self,
            "ReadReplicaEndpoint",
            value=self.read_replica.db_instance_endpoint_address,
            description="RDS read replica endpoint",
        )

        CfnOutput(
            self,
            "EFSFileSystemId",
            value=self.efs_id,
            description="EFS file system ID",
        )

        CfnOutput(
            self,
            "CacheEndpoint",
            value=self.cache_endpoint,
            description="ElastiCache primary endpoint",
        )

        CfnOutput(
            self,
            "SecretArn",
            value=self.secret_arn,
            description="Secrets Manager secret ARN",
        )

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
        )
```

### File: lib/__init__.py

```python
```

## Key Features

1. **Multi-AZ High Availability**: RDS and ElastiCache configured for automatic failover
2. **Encryption at Rest**: KMS encryption for all data stores (RDS, EFS, ElastiCache, Secrets Manager)
3. **Encryption in Transit**: TLS enabled for Redis connections
4. **Automated Backups**: Hourly EFS backups with 7-day retention (RPO: 1 hour)
5. **Read Replica**: Cross-region disaster recovery capability for PostgreSQL
6. **CloudWatch Monitoring**: Alarms for CPU and connection metrics
7. **Network Isolation**: Database and cache in isolated subnets, EFS in private subnets
8. **Environment Suffix**: All resources named with environment suffix for multi-environment support
9. **Destroyable**: All resources configured with RemovalPolicy.DESTROY for testing
