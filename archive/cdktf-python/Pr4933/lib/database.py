"""Database infrastructure for video metadata storage."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json
import random
import string


class DatabaseConstruct(Construct):
    """Database construct for RDS Aurora Serverless v2."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        database_security_group_id: str,
    ):
        super().__init__(scope, construct_id)

        # Generate random password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        # Create DB subnet group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"streamflix-db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={"Name": f"streamflix-db-subnet-group-{environment_suffix}"},
        )

        # Create Secrets Manager secret for database credentials
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"streamflix-db-credentials-{environment_suffix}",
            description="Database credentials for StreamFlix RDS Aurora cluster",
            recovery_window_in_days=0,
            tags={"Name": f"streamflix-db-credentials-{environment_suffix}"},
        )

        # Create secret version
        secret_value = {
            "username": "streamflixadmin",
            "password": password,
            "engine": "postgres",
            "port": 5432,
        }

        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value),
        )

        # Create RDS Aurora Serverless v2 cluster
        self.db_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"streamflix-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="streamflixdb",
            master_username="streamflixadmin",
            master_password=password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[database_security_group_id],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 2.0,
            },
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,
            storage_encrypted=True,
            deletion_protection=False,
            apply_immediately=True,
            tags={"Name": f"streamflix-aurora-{environment_suffix}"},
        )

    @property
    def db_cluster_endpoint(self):
        return self.db_cluster.endpoint

    @property
    def db_cluster_id(self):
        return self.db_cluster.cluster_identifier

    @property
    def db_secret_arn(self):
        return self.db_secret.arn
