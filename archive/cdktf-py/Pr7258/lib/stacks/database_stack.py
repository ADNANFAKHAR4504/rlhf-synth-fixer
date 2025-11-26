"""Database Stack - Aurora PostgreSQL 14 with Multi-AZ and KMS encryption."""

from typing import Dict, List, Any
from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_cluster_parameter_group import RdsClusterParameterGroup


class DatabaseConstruct(Construct):
    """Database Construct with Aurora PostgreSQL 14 Serverless v2."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: List[str],
        db_security_group_id: str,
        db_secret_arn: str,
        **kwargs: Any
    ) -> None:
        """Initialize Database construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            vpc_id: VPC ID for the database
            private_subnet_ids: List of private subnet IDs
            db_security_group_id: Security group ID for RDS
            db_secret_arn: Secrets Manager secret ARN
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create KMS key for database encryption
        self.kms_key = KmsKey(
            self,
            f"db-kms-key-{environment_suffix}",
            description=f"KMS key for payment database encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            tags={
                "Name": f"payment-db-kms-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        KmsAlias(
            self,
            f"db-kms-alias-{environment_suffix}",
            name=f"alias/payment-db-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # Create DB subnet group
        self.db_subnet_group = DbSubnetGroup(
            self,
            f"db-subnet-group-{environment_suffix}",
            name=f"payment-db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            description="Subnet group for Aurora PostgreSQL cluster",
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create cluster parameter group for SSL/TLS enforcement
        self.cluster_param_group = RdsClusterParameterGroup(
            self,
            f"cluster-param-group-{environment_suffix}",
            name=f"payment-cluster-pg-{environment_suffix}",
            family="aurora-postgresql14",  # This is correct for Aurora PostgreSQL 14.x
            description="Cluster parameter group with SSL enforcement",
            parameter=[
                {
                    "name": "rds.force_ssl",
                    "value": "1"
                },
                {
                    "name": "ssl",
                    "value": "1"
                }
            ],
            tags={
                "Name": f"payment-cluster-pg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create Aurora PostgreSQL cluster
        self.db_cluster = RdsCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"payment-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",  # Changed from 14.9 to 14.6 (available version)
            engine_mode="provisioned",
            database_name="payments",
            master_username="dbadmin",
            master_password="TempPassword123!ChangeMe",  # Will be rotated via Secrets Manager
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[db_security_group_id],
            db_cluster_parameter_group_name=self.cluster_param_group.name,
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql"],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 4.0
            },
            tags={
                "Name": f"payment-aurora-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create cluster instances (2 for Multi-AZ)
        self.db_instances: List[RdsClusterInstance] = []
        for i in range(2):
            instance = RdsClusterInstance(
                self,
                f"aurora-instance-{i+1}-{environment_suffix}",
                identifier=f"payment-aurora-instance-{i+1}-{environment_suffix}",
                cluster_identifier=self.db_cluster.id,
                instance_class="db.serverless",
                engine=self.db_cluster.engine,
                engine_version=self.db_cluster.engine_version,
                publicly_accessible=False,
                performance_insights_enabled=True,
                performance_insights_retention_period=7,
                tags={
                    "Name": f"payment-aurora-instance-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )
            self.db_instances.append(instance)

    def get_cluster_endpoint(self) -> str:
        """Get cluster writer endpoint."""
        return self.db_cluster.endpoint

    def get_cluster_reader_endpoint(self) -> str:
        """Get cluster reader endpoint."""
        return self.db_cluster.reader_endpoint

    def get_cluster_arn(self) -> str:
        """Get cluster ARN."""
        return self.db_cluster.arn

    def get_cluster_id(self) -> str:
        """Get cluster identifier."""
        return self.db_cluster.cluster_identifier
