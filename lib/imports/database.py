from constructs import Construct
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
import json


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

        self.environment_suffix = environment_suffix

        # DB Subnet Groups
        self.primary_subnet_group = DbSubnetGroup(
            self,
            "primary_db_subnet_group",
            name=f"payment-primary-db-subnet-{environment_suffix}",
            subnet_ids=primary_subnet_ids,
            tags={
                "Name": f"payment-primary-db-subnet-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        self.secondary_subnet_group = DbSubnetGroup(
            self,
            "secondary_db_subnet_group",
            name=f"payment-secondary-db-subnet-{environment_suffix}",
            subnet_ids=secondary_subnet_ids,
            tags={
                "Name": f"payment-secondary-db-subnet-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Aurora Global Cluster
        self.global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"payment-global-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            database_name="paymentdb",
            storage_encrypted=True,
            provider=primary_provider
        )

        # Primary Secrets Manager secret
        self.primary_secret = SecretsmanagerSecret(
            self,
            "primary_db_secret",
            name=f"payment-primary-db-creds-{environment_suffix}",
            description="Aurora database credentials for primary region",
            tags={
                "Name": f"payment-primary-db-creds-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        db_credentials = {
            "username": "dbadmin",
            "password": "ChangeMe123456!",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "paymentdb"
        }

        SecretsmanagerSecretVersion(
            self,
            "primary_db_secret_version",
            secret_id=self.primary_secret.id,
            secret_string=json.dumps(db_credentials),
            provider=primary_provider
        )

        # Primary Aurora Cluster
        self.primary_cluster = RdsCluster(
            self,
            "primary_cluster",
            cluster_identifier=f"payment-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            database_name="paymentdb",
            master_username="dbadmin",
            master_password="ChangeMe123456!",
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[primary_security_group_id],
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            global_cluster_identifier=self.global_cluster.id,
            tags={
                "Name": f"payment-primary-cluster-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Primary cluster instances (2 for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"primary_instance_{i}",
                identifier=f"payment-primary-instance-{i}-{environment_suffix}",
                cluster_identifier=self.primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="15.3",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-primary-instance-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=primary_provider
            )

        # Secondary Secrets Manager secret
        self.secondary_secret = SecretsmanagerSecret(
            self,
            "secondary_db_secret",
            name=f"payment-secondary-db-creds-{environment_suffix}",
            description="Aurora database credentials for secondary region",
            tags={
                "Name": f"payment-secondary-db-creds-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        SecretsmanagerSecretVersion(
            self,
            "secondary_db_secret_version",
            secret_id=self.secondary_secret.id,
            secret_string=json.dumps(db_credentials),
            provider=secondary_provider
        )

        # Secondary Aurora Cluster
        self.secondary_cluster = RdsCluster(
            self,
            "secondary_cluster",
            cluster_identifier=f"payment-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[secondary_security_group_id],
            storage_encrypted=True,
            skip_final_snapshot=True,
            global_cluster_identifier=self.global_cluster.id,
            depends_on=[self.primary_cluster],
            tags={
                "Name": f"payment-secondary-cluster-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Secondary cluster instances (2 for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"secondary_instance_{i}",
                identifier=f"payment-secondary-instance-{i}-{environment_suffix}",
                cluster_identifier=self.secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="15.3",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-secondary-instance-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=secondary_provider
            )

    @property
    def global_cluster_id(self):
        return self.global_cluster.id

    @property
    def primary_cluster_id(self):
        return self.primary_cluster.id

    @property
    def secondary_cluster_id(self):
        return self.secondary_cluster.id

    @property
    def primary_db_secret_arn(self):
        return self.primary_secret.arn

    @property
    def secondary_db_secret_arn(self):
        return self.secondary_secret.arn
