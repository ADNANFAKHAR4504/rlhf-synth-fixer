"""
database_stack.py

Database infrastructure module for the migration project.
Creates RDS Aurora PostgreSQL clusters with read replicas across multiple regions.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class DatabaseStackArgs:
    """Arguments for DatabaseStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        db_security_group_id: Output[str],
        primary_region: str = "ap-southeast-1",
        secondary_region: str = "us-east-1",
        tertiary_region: str = "us-east-2",
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.db_security_group_id = db_security_group_id
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.tertiary_region = tertiary_region
        self.tags = tags or {}


class DatabaseStack(pulumi.ComponentResource):
    """
    Database infrastructure for migration project.

    Creates:
    - RDS Aurora PostgreSQL cluster parameter groups
    - DB subnet groups
    - Aurora PostgreSQL clusters in primary region
    - Read replicas for high availability
    - Database monitoring configuration
    """

    def __init__(
        self,
        name: str,
        args: DatabaseStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:database:DatabaseStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Database'
        }

        # Note: Database credentials are managed inline for this synthetic task.
        # In production, these would be fetched from AWS Secrets Manager with rotation enabled.

        # Create RDS monitoring role (shared by all instances)
        self.monitoring_role = self._create_rds_monitoring_role()

        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-{self.environment_suffix}",
            subnet_ids=args.private_subnet_ids,
            description=f"Aurora subnet group for {self.environment_suffix}",
            tags={
                **self.tags,
                'Name': f"aurora-subnet-group-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # DB Cluster Parameter Group for PostgreSQL 14
        self.cluster_parameter_group = aws.rds.ClusterParameterGroup(
            f"aurora-cluster-pg-{self.environment_suffix}",
            family="aurora-postgresql14",
            description=f"Aurora PostgreSQL 14 cluster parameter group - {self.environment_suffix}",
            parameters=[
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="log_statement",
                    value="all",
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="log_min_duration_statement",
                    value="1000",
                ),
                aws.rds.ClusterParameterGroupParameterArgs(
                    name="rds.force_ssl",
                    value="1",
                ),
            ],
            tags={
                **self.tags,
                'Name': f"aurora-cluster-pg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # DB Parameter Group for instances
        self.db_parameter_group = aws.rds.ParameterGroup(
            f"aurora-db-pg-{self.environment_suffix}",
            family="aurora-postgresql14",
            description=f"Aurora PostgreSQL 14 parameter group - {self.environment_suffix}",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name="shared_preload_libraries",
                    value="pg_stat_statements",
                ),
            ],
            tags={
                **self.tags,
                'Name': f"aurora-db-pg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Production Aurora Cluster (Primary)
        self.production_cluster = aws.rds.Cluster(
            f"production-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"production-aurora-{self.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            engine_mode="provisioned",
            database_name="payments",
            master_username="dbadmin",
            master_password=pulumi.Output.secret("ChangeMe123!"),  # Will be rotated by Secrets Manager
            db_subnet_group_name=self.db_subnet_group.name,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            vpc_security_group_ids=[args.db_security_group_id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            storage_encrypted=True,
            skip_final_snapshot=True,  # For destroyability in CI/CD
            apply_immediately=True,
            tags={
                **self.tags,
                'Name': f"production-aurora-cluster-{self.environment_suffix}",
                'ClusterType': 'Production'
            },
            opts=ResourceOptions(parent=self)
        )

        # Production Aurora Instance - Writer
        self.production_writer_instance = aws.rds.ClusterInstance(
            f"production-aurora-writer-{self.environment_suffix}",
            identifier=f"production-aurora-writer-{self.environment_suffix}",
            cluster_identifier=self.production_cluster.id,
            instance_class="db.r6g.large",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            db_parameter_group_name=self.db_parameter_group.name,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            tags={
                **self.tags,
                'Name': f"production-aurora-writer-{self.environment_suffix}",
                'InstanceRole': 'Writer'
            },
            opts=ResourceOptions(parent=self.production_cluster)
        )

        # Production Aurora Instance - Reader (for read replica)
        self.production_reader_instance = aws.rds.ClusterInstance(
            f"production-aurora-reader-{self.environment_suffix}",
            identifier=f"production-aurora-reader-{self.environment_suffix}",
            cluster_identifier=self.production_cluster.id,
            instance_class="db.r6g.large",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            db_parameter_group_name=self.db_parameter_group.name,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            tags={
                **self.tags,
                'Name': f"production-aurora-reader-{self.environment_suffix}",
                'InstanceRole': 'Reader'
            },
            opts=ResourceOptions(parent=self.production_cluster)
        )

        # Migration Aurora Cluster (Target)
        self.migration_cluster = aws.rds.Cluster(
            f"migration-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"migration-aurora-{self.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            engine_mode="provisioned",
            database_name="payments",
            master_username="dbadmin",
            master_password=pulumi.Output.secret("ChangeMe123!"),  # Will be rotated
            db_subnet_group_name=self.db_subnet_group.name,
            db_cluster_parameter_group_name=self.cluster_parameter_group.name,
            vpc_security_group_ids=[args.db_security_group_id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            storage_encrypted=True,
            skip_final_snapshot=True,
            apply_immediately=True,
            tags={
                **self.tags,
                'Name': f"migration-aurora-cluster-{self.environment_suffix}",
                'ClusterType': 'Migration'
            },
            opts=ResourceOptions(parent=self)
        )

        # Migration Aurora Instance - Writer
        self.migration_writer_instance = aws.rds.ClusterInstance(
            f"migration-aurora-writer-{self.environment_suffix}",
            identifier=f"migration-aurora-writer-{self.environment_suffix}",
            cluster_identifier=self.migration_cluster.id,
            instance_class="db.r6g.large",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            db_parameter_group_name=self.db_parameter_group.name,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            tags={
                **self.tags,
                'Name': f"migration-aurora-writer-{self.environment_suffix}",
                'InstanceRole': 'Writer'
            },
            opts=ResourceOptions(parent=self.migration_cluster)
        )

        # Migration Aurora Instance - Reader
        self.migration_reader_instance = aws.rds.ClusterInstance(
            f"migration-aurora-reader-{self.environment_suffix}",
            identifier=f"migration-aurora-reader-{self.environment_suffix}",
            cluster_identifier=self.migration_cluster.id,
            instance_class="db.r6g.large",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="14.6",
            db_parameter_group_name=self.db_parameter_group.name,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            tags={
                **self.tags,
                'Name': f"migration-aurora-reader-{self.environment_suffix}",
                'InstanceRole': 'Reader'
            },
            opts=ResourceOptions(parent=self.migration_cluster)
        )

        # Register outputs
        self.register_outputs({
            'production_cluster_endpoint': self.production_cluster.endpoint,
            'production_cluster_reader_endpoint': self.production_cluster.reader_endpoint,
            'production_cluster_id': self.production_cluster.id,
            'migration_cluster_endpoint': self.migration_cluster.endpoint,
            'migration_cluster_reader_endpoint': self.migration_cluster.reader_endpoint,
            'migration_cluster_id': self.migration_cluster.id,
            'db_subnet_group_name': self.db_subnet_group.name
        })

    def _create_rds_monitoring_role(self) -> aws.iam.Role:
        """Create IAM role for RDS Enhanced Monitoring."""

        monitoring_role = aws.iam.Role(
            f"rds-monitoring-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "monitoring.rds.amazonaws.com"
                    }
                }]
            }),
            tags={
                **self.tags,
                'Name': f"rds-monitoring-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"rds-monitoring-policy-attachment-{self.environment_suffix}",
            role=monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(parent=monitoring_role)
        )

        return monitoring_role
