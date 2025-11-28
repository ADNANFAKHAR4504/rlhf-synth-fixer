"""Database stack for Aurora Global Database."""

from constructs import Construct
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster_parameter_group import RdsClusterParameterGroup, RdsClusterParameterGroupParameter


class DatabaseStack(Construct):
    """Aurora Global Database infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_vpc_id: str,
        secondary_vpc_id: str,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        primary_security_group_id: str,
        secondary_security_group_id: str,
    ):
        """Initialize Aurora Global Database in both regions."""
        super().__init__(scope, construct_id)

        # Create Aurora Global Cluster
        global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            provider=primary_provider,
            global_cluster_identifier=f"aurora-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="transactions",
            deletion_protection=False,  # Set to True for production
        )

        # Create DB subnet group in primary region
        primary_subnet_group = DbSubnetGroup(
            self,
            "primary_subnet_group",
            provider=primary_provider,
            name=f"primary-aurora-subnet-{environment_suffix}",
            subnet_ids=primary_subnet_ids,
            tags={
                "Name": f"primary-aurora-subnet-{environment_suffix}",
            },
        )

        # Create DB subnet group in secondary region
        secondary_subnet_group = DbSubnetGroup(
            self,
            "secondary_subnet_group",
            provider=secondary_provider,
            name=f"secondary-aurora-subnet-{environment_suffix}",
            subnet_ids=secondary_subnet_ids,
            tags={
                "Name": f"secondary-aurora-subnet-{environment_suffix}",
            },
        )

        # Create cluster parameter group for primary
        primary_param_group = RdsClusterParameterGroup(
            self,
            "primary_param_group",
            provider=primary_provider,
            name=f"primary-aurora-params-{environment_suffix}",
            family="aurora-mysql8.0",
            description="Parameter group for primary Aurora cluster",
            parameter=[
                RdsClusterParameterGroupParameter(
                    name="binlog_format",
                    value="ROW",
                    apply_method="pending-reboot"
                ),
                RdsClusterParameterGroupParameter(
                    name="character_set_server",
                    value="utf8mb4",
                    apply_method="pending-reboot"
                ),
            ],
            tags={
                "Name": f"primary-aurora-params-{environment_suffix}",
            },
        )

        # Create primary Aurora cluster in us-east-1
        primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            provider=primary_provider,
            cluster_identifier=f"aurora-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            database_name="transactions",
            master_username="admin",
            master_password="ChangeMe123!",  # Use AWS Secrets Manager in production
            db_subnet_group_name=primary_subnet_group.name,
            vpc_security_group_ids=[primary_security_group_id],
            db_cluster_parameter_group_name=primary_param_group.name,
            global_cluster_identifier=global_cluster.id,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            deletion_protection=False,  # Set to True for production
            skip_final_snapshot=True,  # Set to False for production
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0,
            },
            depends_on=[global_cluster],
            tags={
                "Name": f"aurora-primary-{environment_suffix}",
                "Region": "us-east-1",
            },
        )

        # Create primary cluster instance (Serverless v2)
        primary_instance = RdsClusterInstance(
            self,
            "primary_instance",
            provider=primary_provider,
            identifier=f"aurora-primary-instance-1-{environment_suffix}",
            cluster_identifier=primary_cluster.id,
            instance_class="db.serverless",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            tags={
                "Name": f"aurora-primary-instance-1-{environment_suffix}",
            },
        )

        # Create secondary Aurora cluster in us-west-2
        secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            provider=secondary_provider,
            cluster_identifier=f"aurora-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            engine_mode="provisioned",
            db_subnet_group_name=secondary_subnet_group.name,
            vpc_security_group_ids=[secondary_security_group_id],
            global_cluster_identifier=global_cluster.id,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            deletion_protection=False,  # Set to True for production
            skip_final_snapshot=True,  # Set to False for production
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0,
            },
            depends_on=[primary_cluster],
            tags={
                "Name": f"aurora-secondary-{environment_suffix}",
                "Region": "us-west-2",
            },
            lifecycle={
                "ignore_changes": ["master_username", "master_password"],
            },
        )

        # Create secondary cluster instance (Serverless v2)
        secondary_instance = RdsClusterInstance(
            self,
            "secondary_instance",
            provider=secondary_provider,
            identifier=f"aurora-secondary-instance-1-{environment_suffix}",
            cluster_identifier=secondary_cluster.id,
            instance_class="db.serverless",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            publicly_accessible=False,
            tags={
                "Name": f"aurora-secondary-instance-1-{environment_suffix}",
            },
        )

        # Export attributes for use in other stacks
        self.global_cluster_id = global_cluster.id
        self.primary_cluster_id = primary_cluster.id
        self.secondary_cluster_id = secondary_cluster.id
        self.primary_cluster_endpoint = primary_cluster.endpoint
        self.secondary_cluster_endpoint = secondary_cluster.endpoint
        self.primary_cluster_arn = primary_cluster.arn
        self.secondary_cluster_arn = secondary_cluster.arn