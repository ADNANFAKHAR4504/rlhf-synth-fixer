from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.kms_key import KmsKey


class DatabaseConstruct(Construct):
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
        secondary_security_group_id: str
    ):
        super().__init__(scope, construct_id)

        # Global Aurora cluster
        self.global_cluster = RdsGlobalCluster(
            self,
            "global-cluster",
            global_cluster_identifier=f"trading-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="tradingdb",
            storage_encrypted=True,
            provider=primary_provider
        )

        # Primary region subnet group
        primary_subnet_group = DbSubnetGroup(
            self,
            "primary-subnet-group",
            name=f"primary-db-subnet-{environment_suffix}",
            subnet_ids=primary_subnet_ids,
            tags={"Name": f"primary-db-subnet-{environment_suffix}"},
            provider=primary_provider
        )

        # Primary Aurora cluster
        self.primary_cluster = RdsCluster(
            self,
            "primary-cluster",
            cluster_identifier=f"primary-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="tradingdb",
            master_username="admin",
            master_password=f"SecurePass{environment_suffix}2024",
            db_subnet_group_name=primary_subnet_group.name,
            vpc_security_group_ids=[primary_security_group_id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            storage_encrypted=True,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            global_cluster_identifier=self.global_cluster.id,
            skip_final_snapshot=True,
            tags={"Name": f"primary-aurora-{environment_suffix}"},
            provider=primary_provider,
            depends_on=[self.global_cluster]
        )

        # Primary cluster instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary-instance-{i}",
                identifier=f"primary-aurora-{environment_suffix}-{i}",
                cluster_identifier=self.primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-mysql",
                engine_version="8.0.mysql_aurora.3.04.0",
                publicly_accessible=False,
                tags={"Name": f"primary-aurora-{environment_suffix}-{i}"},
                provider=primary_provider
            )

        # Secondary region subnet group
        secondary_subnet_group = DbSubnetGroup(
            self,
            "secondary-subnet-group",
            name=f"secondary-db-subnet-{environment_suffix}",
            subnet_ids=secondary_subnet_ids,
            tags={"Name": f"secondary-db-subnet-{environment_suffix}"},
            provider=secondary_provider
        )

        # KMS key for secondary cluster encryption (required for cross-region replica)
        secondary_kms_key = KmsKey(
            self,
            "secondary-kms-key",
            description=f"KMS key for Aurora secondary cluster encryption - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={"Name": f"secondary-aurora-kms-{environment_suffix}"},
            provider=secondary_provider
        )

        # Secondary Aurora cluster (read replica of global cluster)
        self.secondary_cluster = RdsCluster(
            self,
            "secondary-cluster",
            cluster_identifier=f"secondary-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=secondary_subnet_group.name,
            vpc_security_group_ids=[secondary_security_group_id],
            storage_encrypted=True,
            kms_key_id=secondary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            global_cluster_identifier=self.global_cluster.id,
            skip_final_snapshot=True,
            tags={"Name": f"secondary-aurora-{environment_suffix}"},
            provider=secondary_provider,
            depends_on=[self.primary_cluster]
        )

        # Secondary cluster instances
        for i in range(2):
            RdsClusterInstance(
                self,
                f"secondary-instance-{i}",
                identifier=f"secondary-aurora-{environment_suffix}-{i}",
                cluster_identifier=self.secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-mysql",
                engine_version="8.0.mysql_aurora.3.04.0",
                publicly_accessible=False,
                tags={"Name": f"secondary-aurora-{environment_suffix}-{i}"},
                provider=secondary_provider
            )

    @property
    def primary_cluster_endpoint(self):
        return self.primary_cluster.endpoint

    @property
    def secondary_cluster_endpoint(self):
        return self.secondary_cluster.endpoint

    @property
    def primary_cluster_id(self):
        return self.primary_cluster.cluster_identifier

    @property
    def secondary_cluster_id(self):
        return self.secondary_cluster.cluster_identifier
