from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from constructs import Construct
import json

class DatabaseModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 networking, security, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # FIXED: Database password stored in Secrets Manager
        self.db_secret = SecretsmanagerSecret(self, "db-secret",
            provider=primary_provider,
            name=f"payment/db/master-password-{environment_suffix}",
            description="Aurora master password for payment processing",
            recovery_window_in_days=7,
            tags={
                "Name": f"payment-db-secret-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Generate initial password
        self.db_secret_version = SecretsmanagerSecretVersion(self, "db-secret-version",
            provider=primary_provider,
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "dbadmin",
                "password": "TempPassword123!ChangeMe"  # Should be rotated immediately
            })
        )
        
        # Store the password for use in cluster creation
        self.db_password = "TempPassword123!ChangeMe"

        # DB Subnet Groups
        self.primary_db_subnet_group = DbSubnetGroup(self, "primary-db-subnet-group",
            provider=primary_provider,
            name=f"payment-db-subnet-primary-{environment_suffix}",
            subnet_ids=[s.id for s in networking.primary_subnets],
            tags={
                "Name": f"payment-db-subnet-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_db_subnet_group = DbSubnetGroup(self, "secondary-db-subnet-group",
            provider=secondary_provider,
            name=f"payment-db-subnet-secondary-{environment_suffix}",
            subnet_ids=[s.id for s in networking.secondary_subnets],
            tags={
                "Name": f"payment-db-subnet-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # FIXED: Global Database Cluster with encryption
        self.global_cluster = RdsGlobalCluster(self, "global-cluster",
            provider=primary_provider,
            global_cluster_identifier=f"payment-global-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="payments",
            storage_encrypted=True
        )

        # FIXED: Primary Regional Cluster with encryption and security group
        self.primary_cluster = RdsCluster(self, "primary-cluster",
            provider=primary_provider,
            cluster_identifier=f"payment-cluster-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            database_name="payments",
            master_username="dbadmin",
            master_password=self.db_password,
            db_subnet_group_name=self.primary_db_subnet_group.name,
            vpc_security_group_ids=[networking.primary_rds_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            storage_encrypted=True,
            kms_key_id=security.primary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            global_cluster_identifier=self.global_cluster.id,
            lifecycle={
                "prevent_destroy": False
            },
            tags={
                "Name": f"payment-cluster-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Primary Cluster Instances
        self.primary_instances = []
        for i in range(2):
            instance = RdsClusterInstance(self, f"primary-instance-{i}",
                provider=primary_provider,
                identifier=f"payment-db-primary-{i}-{environment_suffix}",
                cluster_identifier=self.primary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                performance_insights_enabled=True,
                performance_insights_kms_key_id=security.primary_kms_key.arn,
                tags={
                    "Name": f"payment-db-primary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.primary_instances.append(instance)

        # FIXED: Secondary Regional Cluster with encryption and security group
        # Force recreation by changing the resource name temporarily
        self.secondary_cluster = RdsCluster(self, "secondary-cluster-v2",
            provider=secondary_provider,
            cluster_identifier=f"payment-cluster-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_db_subnet_group.name,
            vpc_security_group_ids=[networking.secondary_rds_sg.id],
            storage_encrypted=True,
            kms_key_id=security.secondary_kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            global_cluster_identifier=self.global_cluster.id,
            depends_on=[self.primary_cluster],
            lifecycle={
                "prevent_destroy": False
            },
            tags={
                "Name": f"payment-cluster-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Secondary Cluster Instances
        self.secondary_instances = []
        for i in range(2):
            instance = RdsClusterInstance(self, f"secondary-instance-v2-{i}",
                provider=secondary_provider,
                identifier=f"payment-db-secondary-{i}-{environment_suffix}",
                cluster_identifier=self.secondary_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                performance_insights_enabled=True,
                performance_insights_kms_key_id=security.secondary_kms_key.arn,
                tags={
                    "Name": f"payment-db-secondary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.secondary_instances.append(instance)
