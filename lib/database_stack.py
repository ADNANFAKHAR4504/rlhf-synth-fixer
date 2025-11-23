"""Database infrastructure with Aurora Global Database and DynamoDB Global Tables."""

from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class DatabaseStack(Construct):
    """Database infrastructure with Aurora Global DB and DynamoDB Global Tables."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_region: str, secondary_region: str, primary_provider, secondary_provider,
                 primary_vpc, secondary_vpc, primary_private_subnets, secondary_private_subnets,
                 primary_db_security_group, secondary_db_security_group):
        super().__init__(scope, construct_id)

        # Aurora Global Cluster
        global_cluster = RdsGlobalCluster(
            self, "global_cluster",
            global_cluster_identifier=f"payment-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            storage_encrypted=False,  # Simplified for testing - production should use KMS encryption
            provider=primary_provider,
        )

        # Primary DB subnet group
        primary_subnet_group = DbSubnetGroup(
            self, "primary_subnet_group",
            name=f"payment-primary-subnet-{environment_suffix}",
            subnet_ids=[s.id for s in primary_private_subnets],
            tags={"Name": f"payment-primary-subnet-{environment_suffix}"},
            provider=primary_provider,
        )

        # Primary Aurora cluster (writer)
        primary_cluster = RdsCluster(
            self, "primary_cluster",
            cluster_identifier=f"payment-primary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMeInProduction123!",
            db_subnet_group_name=primary_subnet_group.name,
            vpc_security_group_ids=[primary_db_security_group.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            # backtrack_window not supported for global databases
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=False,  # Simplified for testing - matches global cluster encryption
            tags={"Name": f"payment-primary-cluster-{environment_suffix}"},
            provider=primary_provider,
            depends_on=[global_cluster],
        )

        # Primary Aurora instance
        RdsClusterInstance(
            self, "primary_instance",
            identifier=f"payment-primary-instance-{environment_suffix}",
            cluster_identifier=primary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-primary-instance-{environment_suffix}"},
            provider=primary_provider,
        )

        self.primary_aurora_endpoint = primary_cluster.endpoint
        self.primary_aurora_cluster_id = primary_cluster.cluster_identifier
        self.primary_aurora_cluster_arn = primary_cluster.arn

        # Secondary DB subnet group
        secondary_subnet_group = DbSubnetGroup(
            self, "secondary_subnet_group",
            name=f"payment-secondary-subnet-{environment_suffix}",
            subnet_ids=[s.id for s in secondary_private_subnets],
            tags={"Name": f"payment-secondary-subnet-{environment_suffix}"},
            provider=secondary_provider,
        )

        # Secondary Aurora cluster (reader)
        secondary_cluster = RdsCluster(
            self, "secondary_cluster",
            cluster_identifier=f"payment-secondary-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=secondary_subnet_group.name,
            vpc_security_group_ids=[secondary_db_security_group.id],
            global_cluster_identifier=global_cluster.id,
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=False,  # Simplified for testing - matches global cluster encryption
            tags={"Name": f"payment-secondary-cluster-{environment_suffix}"},
            provider=secondary_provider,
            depends_on=[primary_cluster],
        )

        # Secondary Aurora instance
        RdsClusterInstance(
            self, "secondary_instance",
            identifier=f"payment-secondary-instance-{environment_suffix}",
            cluster_identifier=secondary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-secondary-instance-{environment_suffix}"},
            provider=secondary_provider,
        )

        self.secondary_aurora_endpoint = secondary_cluster.endpoint
        self.secondary_aurora_cluster_id = secondary_cluster.cluster_identifier

        # DynamoDB Global Table
        self.dynamodb_table_name = f"payment-sessions-{environment_suffix}"
        DynamodbTable(
            self, "sessions_table",
            name=self.dynamodb_table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[DynamodbTableAttribute(name="session_id", type="S")],
            point_in_time_recovery={"enabled": True},
            replica=[DynamodbTableReplica(region_name=secondary_region, point_in_time_recovery=True)],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={"Name": f"payment-sessions-{environment_suffix}"},
            provider=primary_provider,
        )

        # Store endpoints in Parameter Store (both regions)
        for name, value, desc in [
            ("primary/endpoint", primary_cluster.endpoint, "Primary Aurora endpoint"),
            ("secondary/endpoint", secondary_cluster.endpoint, "Secondary Aurora endpoint"),
            ("dynamodb/table", self.dynamodb_table_name, "DynamoDB table name"),
        ]:
            SsmParameter(
                self, f"param_{name.replace('/', '_')}_primary",
                name=f"/payment/{environment_suffix}/db/{name}",
                type="SecureString" if "endpoint" in name else "String",
                value=value,
                description=desc,
                tags={"Name": f"payment-param-{name.replace('/', '-')}-{environment_suffix}"},
                provider=primary_provider,
            )
            SsmParameter(
                self, f"param_{name.replace('/', '_')}_secondary",
                name=f"/payment/{environment_suffix}/db/{name}",
                type="SecureString" if "endpoint" in name else "String",
                value=value,
                description=desc,
                tags={"Name": f"payment-param-{name.replace('/', '-')}-{environment_suffix}"},
                provider=secondary_provider,
            )

        # IAM role for cross-region DB access
        cross_region_role = IamRole(
            self, "cross_region_role",
            name=f"payment-db-cross-region-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-db-cross-region-{environment_suffix}"},
            provider=primary_provider,
        )

        for policy_arn in [
            "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
            "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
            "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess",
        ]:
            IamRolePolicyAttachment(
                self, f"attach_{policy_arn.split('/')[-1]}",
                role=cross_region_role.name,
                policy_arn=policy_arn,
                provider=primary_provider,
            )