"""
Database Stack - RDS Aurora MySQL Serverless v2
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws


class DatabaseStackArgs:
    """Arguments for DatabaseStack"""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: pulumi.Input[str],
        database_subnet_ids: List[pulumi.Input[str]],
        rds_sg_id: pulumi.Input[str],
        kms_key_id: pulumi.Input[str],
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.database_subnet_ids = database_subnet_ids
        self.rds_sg_id = rds_sg_id
        self.kms_key_id = kms_key_id
        self.tags = tags or {}


class DatabaseStack(pulumi.ComponentResource):
    """
    RDS Aurora MySQL Serverless v2 cluster with encryption and IAM authentication.
    """

    def __init__(
        self,
        name: str,
        args: DatabaseStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:database:DatabaseStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"loan-db-subnet-group-{self.environment_suffix}",
            subnet_ids=args.database_subnet_ids,
            tags={**self.tags, "Name": f"loan-db-subnet-group-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Aurora Serverless v2 Cluster
        self.cluster = aws.rds.Cluster(
            f"loan-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"loan-aurora-cluster-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_mode="provisioned",
            database_name="loandb",
            master_username="admin",
            manage_master_user_password=True,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[args.rds_sg_id],
            storage_encrypted=True,
            kms_key_id=args.kms_key_id,
            iam_database_authentication_enabled=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            apply_immediately=True,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=4.0
            ),
            tags={**self.tags, "Name": f"loan-aurora-cluster-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.db_subnet_group])
        )

        # Create Aurora Serverless v2 Instance
        self.cluster_instance = aws.rds.ClusterInstance(
            f"loan-aurora-instance-{self.environment_suffix}",
            identifier=f"loan-aurora-instance-{self.environment_suffix}",
            cluster_identifier=self.cluster.id,
            instance_class="db.serverless",
            engine=self.cluster.engine,
            engine_version=self.cluster.engine_version,
            publicly_accessible=False,
            tags={**self.tags, "Name": f"loan-aurora-instance-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.cluster])
        )

        self.register_outputs({
            "cluster_id": self.cluster.id,
            "cluster_endpoint": self.cluster.endpoint,
            "cluster_reader_endpoint": self.cluster.reader_endpoint,
            "database_name": self.cluster.database_name
        })
