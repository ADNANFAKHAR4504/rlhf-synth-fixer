"""
RDS Module - Creates Aurora PostgreSQL cluster with conditional Multi-AZ.
Supports environment-specific configurations and automated backups.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from typing import List


class RdsModule(Construct):
    """
    RDS Aurora PostgreSQL Module.
    Creates database cluster with conditional Multi-AZ based on environment.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        vpc_id: str,
        subnet_ids: List[str],
        allowed_security_group_id: str,
        database_name: str = "appdb",
        master_username: str = "dbadmin",
        instance_class: str = "db.t3.medium",
        multi_az: bool = False,
        version: str = "v2",
        **kwargs
    ):
        """
        Initialize RDS module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            vpc_id: VPC ID where RDS will be deployed
            subnet_ids: List of subnet IDs for DB subnet group
            allowed_security_group_id: Security group ID allowed to access DB
            database_name: Name of the database to create
            master_username: Master username for the database
            instance_class: RDS instance class
            multi_az: Whether to enable Multi-AZ deployment
            version: Version suffix for resource naming (default: v2)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace
        self.version = version

        # Create DB subnet group
        self.db_subnet_group = DbSubnetGroup(
            self,
            f"db-subnet-group-{version}-{environment_suffix}",
            name=f"db-subnet-group-{environment_suffix}-{version}",
            subnet_ids=subnet_ids,
            tags={
                "Name": f"db-subnet-group-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create security group for RDS
        self.db_security_group = SecurityGroup(
            self,
            f"db-sg-{version}-{environment_suffix}",
            name=f"db-sg-{environment_suffix}-{version}",
            description=f"Security group for RDS Aurora cluster - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[allowed_security_group_id],
                    description="PostgreSQL access from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"db-sg-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create RDS Aurora cluster
        self.db_cluster = RdsCluster(
            self,
            f"aurora-cluster-{version}-{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}-{version}",
            engine="aurora-postgresql",
            engine_version="15",  # Updated to valid version for aurora-postgresql
            database_name=database_name,
            master_username=master_username,
            master_password="ChangeMe123!",  # Should be from Secrets Manager in production
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            skip_final_snapshot=True,  # CRITICAL: For destroyability
            deletion_protection=False,  # CRITICAL: For destroyability
            backup_retention_period=7 if workspace == "prod" else 1,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            storage_encrypted=True,
            tags={
                "Name": f"aurora-cluster-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Create cluster instances (Multi-AZ if specified)
        self.db_instances: List[RdsClusterInstance] = []
        instance_count = 2 if multi_az else 1

        for i in range(instance_count):
            instance = RdsClusterInstance(
                self,
                f"aurora-instance-{i}-{version}-{environment_suffix}",
                identifier=f"aurora-instance-{i}-{environment_suffix}-{version}",
                cluster_identifier=self.db_cluster.id,
                instance_class=instance_class,
                engine=self.db_cluster.engine,
                engine_version=self.db_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"aurora-instance-{i}-{environment_suffix}-{version}",
                    "Workspace": workspace,
                    "Instance": str(i),
                    "Version": version
                }
            )
            self.db_instances.append(instance)

    def get_cluster_endpoint(self) -> str:
        """Return cluster writer endpoint."""
        return self.db_cluster.endpoint

    def get_cluster_reader_endpoint(self) -> str:
        """Return cluster reader endpoint."""
        return self.db_cluster.reader_endpoint

    def get_cluster_id(self) -> str:
        """Return cluster identifier."""
        return self.db_cluster.id

    def get_security_group_id(self) -> str:
        """Return database security group ID."""
        return self.db_security_group.id
