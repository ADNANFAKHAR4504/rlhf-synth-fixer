"""Database infrastructure with Aurora and DynamoDB."""

import os
from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class DatabaseStack(Construct):
    """Database infrastructure with Aurora and DynamoDB."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 region: str, provider, vpc, private_subnets, db_security_group):
        super().__init__(scope, construct_id)

        # Get database password from environment variable
        # For production, use AWS Secrets Manager instead
        db_password = os.environ.get("DB_MASTER_PASSWORD", "ChangeMeInProduction123!")

        # DB subnet group
        subnet_group = DbSubnetGroup(
            self, "subnet_group",
            name=f"payment-subnet-{environment_suffix}",
            subnet_ids=[s.id for s in private_subnets],
            tags={"Name": f"payment-subnet-{environment_suffix}"},
            provider=provider,
        )

        # Aurora cluster (single region)
        cluster = RdsCluster(
            self, "cluster",
            cluster_identifier=f"payment-cluster-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="payments",
            master_username="admin",
            master_password=db_password,
            db_subnet_group_name=subnet_group.name,
            vpc_security_group_ids=[db_security_group.id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            backtrack_window=259200,  # 72 hours in seconds
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=False,  # Simplified for testing - production should use KMS encryption
            tags={"Name": f"payment-cluster-{environment_suffix}"},
            provider=provider,
        )

        # Aurora instance
        RdsClusterInstance(
            self, "instance",
            identifier=f"payment-instance-{environment_suffix}",
            cluster_identifier=cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            tags={"Name": f"payment-instance-{environment_suffix}"},
            provider=provider,
        )

        self.aurora_endpoint = cluster.endpoint
        self.aurora_cluster_id = cluster.cluster_identifier
        self.aurora_cluster_arn = cluster.arn

        # DynamoDB Table (single region)
        self.dynamodb_table_name = f"payment-sessions-{environment_suffix}"
        DynamodbTable(
            self, "sessions_table",
            name=self.dynamodb_table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            attribute=[DynamodbTableAttribute(name="session_id", type="S")],
            point_in_time_recovery={"enabled": True},
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags={"Name": f"payment-sessions-{environment_suffix}"},
            provider=provider,
        )

        # Store endpoints in Parameter Store
        for name, value, desc in [
            ("endpoint", cluster.endpoint, "Aurora endpoint"),
            ("dynamodb/table", self.dynamodb_table_name, "DynamoDB table name"),
        ]:
            SsmParameter(
                self, f"param_{name.replace('/', '_')}",
                name=f"/payment/{environment_suffix}/db/{name}",
                type="SecureString" if "endpoint" in name else "String",
                value=value,
                description=desc,
                tags={"Name": f"payment-param-{name.replace('/', '-')}-{environment_suffix}"},
                provider=provider,
            )

        # IAM role for DB access
        db_access_role = IamRole(
            self, "db_access_role",
            name=f"payment-db-access-{environment_suffix}",
            assume_role_policy='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}',
            tags={"Name": f"payment-db-access-{environment_suffix}"},
            provider=provider,
        )

        for policy_arn in [
            "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
            "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
            "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess",
        ]:
            IamRolePolicyAttachment(
                self, f"attach_{policy_arn.split('/')[-1]}",
                role=db_access_role.name,
                policy_arn=policy_arn,
                provider=provider,
            )
