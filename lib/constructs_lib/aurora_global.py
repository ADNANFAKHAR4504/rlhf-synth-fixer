"""
Aurora Global Database Construct
Creates Aurora PostgreSQL 15 cluster with global replication
"""

import json
from typing import List

from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from constructs import Construct


class AuroraGlobalConstruct(Construct):
    """
    Aurora Global Database construct for multi-region replication.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        vpc_id: str,
        private_subnet_ids: List[str],
        database_security_group_id: str,
        kms_key_arn: str,
        is_primary: bool,
        global_cluster_id: str = None,
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = region
        self.is_primary = is_primary

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db-subnet-group",
            name=f"aurora-subnet-group-{environment_suffix}-{region}",
            subnet_ids=private_subnet_ids,
            description=f"Aurora subnet group for {region}",
            tags={
                "Name": f"aurora-subnet-group-{environment_suffix}-{region}",
            }
        )

        # Master credentials secret
        master_username = "postgres_admin"
        master_password_secret = SecretsmanagerSecret(
            self,
            "master-password",
            name=f"aurora-master-password-{environment_suffix}-{region}",
            description=f"Aurora master password for {region}",
            recovery_window_in_days=0,  # Allow immediate deletion for testing
            kms_key_id=kms_key_arn,
        )

        # Store password in secret
        SecretsmanagerSecretVersion(
            self,
            "master-password-version",
            secret_id=master_password_secret.id,
            secret_string=json.dumps({
                "username": master_username,
                "password": "ChangeMe123!SecurePassword",  # Should be rotated
                "engine": "postgres",
                "host": "",  # Will be updated after cluster creation
                "port": 5432,
                "dbname": "trading_db",
            })
        )

        if is_primary:
            # Create Global Cluster (only in primary region)
            global_cluster = RdsGlobalCluster(
                self,
                "global-cluster",
                global_cluster_identifier=f"aurora-global-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="15.3",
                database_name="trading_db",
                storage_encrypted=True,
                deletion_protection=False,  # Allow deletion for testing
            )

            # Primary Cluster
            self.cluster = RdsCluster(
                self,
                "cluster",
                cluster_identifier=f"aurora-primary-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="15.3",
                database_name="trading_db",
                master_username=master_username,
                master_password="ChangeMe123!SecurePassword",
                db_subnet_group_name=db_subnet_group.name,
                vpc_security_group_ids=[database_security_group_id],
                kms_key_id=kms_key_arn,
                storage_encrypted=True,
                backup_retention_period=7,
                preferred_backup_window="03:00-04:00",
                preferred_maintenance_window="mon:04:00-mon:05:00",
                enabled_cloudwatch_logs_exports=["postgresql"],
                global_cluster_identifier=global_cluster.id,
                deletion_protection=False,
                skip_final_snapshot=True,
                depends_on=[global_cluster],
                tags={
                    "Name": f"aurora-primary-{environment_suffix}",
                    "Role": "Primary",
                }
            )
        else:
            # Secondary Cluster (read replica)
            # Requires global_cluster_id from primary stack
            if not global_cluster_id:
                raise ValueError("global_cluster_id is required for secondary cluster")

            self.cluster = RdsCluster(
                self,
                "cluster",
                cluster_identifier=f"aurora-secondary-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="15.3",
                db_subnet_group_name=db_subnet_group.name,
                vpc_security_group_ids=[database_security_group_id],
                kms_key_id=kms_key_arn,
                storage_encrypted=True,
                enabled_cloudwatch_logs_exports=["postgresql"],
                global_cluster_identifier=global_cluster_id,
                deletion_protection=False,
                skip_final_snapshot=True,
                tags={
                    "Name": f"aurora-secondary-{environment_suffix}",
                    "Role": "Secondary",
                }
            )

        # Cluster Instances (2 instances for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"instance-{i}",
                identifier=f"aurora-{('primary' if is_primary else 'secondary')}-{environment_suffix}-{i+1}",
                cluster_identifier=self.cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                publicly_accessible=False,
                performance_insights_enabled=True,
                performance_insights_retention_period=7,
                # Monitoring disabled to avoid IAM role dependency
                # In production, create IAM role: arn:aws:iam::{account}:role/rds-monitoring-role
                tags={
                    "Name": f"aurora-instance-{environment_suffix}-{region}-{i+1}",
                }
            )

        self._master_secret_arn = master_password_secret.arn

        # Store global cluster reference for secondary stack
        if is_primary:
            self._global_cluster_id = global_cluster.id
        else:
            self._global_cluster_id = None

    @property
    def cluster_id(self) -> str:
        return self.cluster.id

    @property
    def writer_endpoint(self) -> str:
        return self.cluster.endpoint

    @property
    def reader_endpoint(self) -> str:
        return self.cluster.reader_endpoint

    @property
    def master_secret_arn(self) -> str:
        return self._master_secret_arn

    @property
    def global_cluster_id(self) -> str:
        """Returns the global cluster ID (only available in primary)"""
        return self._global_cluster_id