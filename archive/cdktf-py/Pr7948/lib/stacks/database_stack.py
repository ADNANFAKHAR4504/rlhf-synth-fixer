"""Database infrastructure - DynamoDB Global Tables and Aurora Global Database"""

import os
from constructs import Construct
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTableReplica,
    DynamodbTablePointInTimeRecovery,
    DynamodbTableGlobalSecondaryIndex,
)
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class DatabaseStack(Construct):
    """Creates DynamoDB Global Tables and Aurora Global Database"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        is_primary: bool,
        network_stack=None
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix
        self.is_primary = is_primary

        # KMS key for encryption
        self.kms_key = KmsKey(
            self,
            "db-kms-key",
            description=f"KMS key for database encryption in {region}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"dr-db-kms-{region}-{environment_suffix}"
            }
        )

        KmsAlias(
            self,
            "db-kms-alias",
            name=f"alias/dr-db-{region}-{environment_suffix}",
            target_key_id=self.kms_key.id
        )

        # DynamoDB Global Table - only create in primary region with replica
        if self.is_primary:
            other_region = "us-east-2" if region == "us-east-1" else "us-east-1"
            # For Global Tables, omit kms_key_arn in replica to use AWS managed encryption
            replica_config = [
                DynamodbTableReplica(
                    region_name=other_region
                    # AWS managed encryption is used by default when kms_key_arn is omitted
                )
            ]

            self.dynamodb_table = DynamodbTable(
                self,
                "payments-table",
                name=f"dr-payments-{environment_suffix}",
                billing_mode="PAY_PER_REQUEST",
                hash_key="transactionId",
                range_key="timestamp",
                attribute=[
                    DynamodbTableAttribute(
                        name="transactionId",
                        type="S"
                    ),
                    DynamodbTableAttribute(
                        name="timestamp",
                        type="N"
                    ),
                    DynamodbTableAttribute(
                        name="customerId",
                        type="S"
                    )
                ],
                global_secondary_index=[
                    DynamodbTableGlobalSecondaryIndex(
                        name="CustomerIndex",
                        hash_key="customerId",
                        range_key="timestamp",
                        projection_type="ALL"
                    )
                ],
                replica=replica_config,
                point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                    enabled=True
                ),
                stream_enabled=True,
                stream_view_type="NEW_AND_OLD_IMAGES",
                server_side_encryption={
                    "enabled": True
                    # Use AWS managed encryption for Global Tables
                    # Custom KMS requires valid ARN in each replica region
                },
                tags={
                    "Name": f"dr-payments-{environment_suffix}"
                }
            )
        else:
            # Secondary region doesn't create table - it's replicated from primary
            self.dynamodb_table = None

        # Aurora Global Database
        if self.is_primary:
            # Create global cluster in primary region only
            self.global_cluster = RdsGlobalCluster(
                self,
                "aurora-global-cluster",
                global_cluster_identifier=f"dr-aurora-global-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="14.6",
                database_name="payments",
                storage_encrypted=True,
                deletion_protection=False
            )

        # DB Subnet Group - get private subnets from network stack
        if network_stack is None:
            raise ValueError("network_stack is required for DatabaseStack")

        self.db_subnet_group = DbSubnetGroup(
            self,
            "aurora-subnet-group",
            name=f"dr-aurora-subnet-{region}-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in network_stack.private_subnets],
            tags={
                "Name": f"dr-aurora-subnet-{region}-{environment_suffix}"
            }
        )

        # Aurora Cluster
        if self.is_primary:
            # Primary cluster (read-write)
            self.aurora_cluster = RdsCluster(
                self,
                "aurora-cluster",
                cluster_identifier=f"dr-aurora-{region}-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="14.6",
                engine_mode="provisioned",
                database_name="payments",
                master_username="dbadmin",
                master_password=os.environ.get("TF_VAR_db_password", "ChangeMe123!"),  # noqa: S105
                db_subnet_group_name=self.db_subnet_group.name,
                vpc_security_group_ids=[network_stack.aurora_security_group.id],
                backup_retention_period=7,
                preferred_backup_window="03:00-04:00",
                preferred_maintenance_window="mon:04:00-mon:05:00",
                storage_encrypted=True,
                kms_key_id=self.kms_key.arn,
                enabled_cloudwatch_logs_exports=["postgresql"],
                deletion_protection=False,
                skip_final_snapshot=True,
                global_cluster_identifier=self.global_cluster.id if self.is_primary else None,
                tags={
                    "Name": f"dr-aurora-{region}-{environment_suffix}"
                }
            )
        else:
            # Secondary cluster (read-only replica) joining global cluster
            # For cross-region replicas, do NOT specify master_username or master_password
            # The credentials are inherited from the primary cluster
            self.aurora_cluster = RdsCluster(
                self,
                "aurora-cluster",
                cluster_identifier=f"dr-aurora-{region}-{environment_suffix}",
                engine="aurora-postgresql",
                engine_version="14.6",
                engine_mode="provisioned",
                db_subnet_group_name=self.db_subnet_group.name,
                vpc_security_group_ids=[network_stack.aurora_security_group.id],
                storage_encrypted=True,
                kms_key_id=self.kms_key.arn,
                enabled_cloudwatch_logs_exports=["postgresql"],
                deletion_protection=False,
                skip_final_snapshot=True,
                global_cluster_identifier=f"dr-aurora-global-{environment_suffix}",
                tags={
                    "Name": f"dr-aurora-{region}-{environment_suffix}"
                }
            )

        # Aurora Cluster Instances (2 instances per cluster for HA)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora-instance-{i}",
                identifier=f"dr-aurora-{region}-{i}-{environment_suffix}",
                cluster_identifier=self.aurora_cluster.id,
                instance_class="db.r6g.large",
                engine="aurora-postgresql",
                engine_version="14.6",
                publicly_accessible=False,
                tags={
                    "Name": f"dr-aurora-{region}-{i}-{environment_suffix}"
                }
            )
