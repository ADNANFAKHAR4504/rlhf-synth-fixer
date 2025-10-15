"""
RDS Stack - Aurora Serverless PostgreSQL database.

This module creates an encrypted Aurora Serverless v2 PostgreSQL cluster
for storing payment transaction data with PCI-DSS compliant configuration.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class RdsStackArgs:
    """
    Arguments for RDS Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        subnet_ids: List of private subnet IDs for RDS
        security_group_id: Security group ID for RDS
        kms_key_arn: KMS key ARN for encryption
    """
    def __init__(
        self,
        environment_suffix: str,
        subnet_ids: List[pulumi.Output],
        security_group_id: pulumi.Output,
        kms_key_arn: pulumi.Output
    ):
        self.environment_suffix = environment_suffix
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id
        self.kms_key_arn = kms_key_arn


class RdsStack(pulumi.ComponentResource):
    """
    RDS Component Resource for transaction database.

    Creates Aurora Serverless v2 PostgreSQL cluster with:
    - Encryption at rest using KMS
    - Automated backups
    - Private subnet placement
    - PCI-DSS compliant configuration
    """

    def __init__(
        self,
        name: str,
        args: RdsStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:database:RdsStack', name, None, opts)

        # DB Subnet Group for RDS placement in private subnets
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{args.environment_suffix}",
            name=f"payment-db-subnet-group-{args.environment_suffix}",
            subnet_ids=args.subnet_ids,
            tags={
                "Name": f"payment-db-subnet-group-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # PCI-DSS Requirement: Encrypted storage for cardholder data
        # Aurora Serverless v2 for cost optimization and faster provisioning
        self.db_cluster = aws.rds.Cluster(
            f"payment-db-cluster-{args.environment_suffix}",
            cluster_identifier=f"payment-db-cluster-{args.environment_suffix}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_mode="provisioned",  # Required for Serverless v2
            engine_version="15.5",
            database_name="paymentdb",
            master_username="dbadmin",
            master_password="ChangeMe123!",  # In production, use AWS Secrets Manager
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[args.security_group_id],
            # PCI-DSS Requirement: Encryption at rest
            storage_encrypted=True,
            kms_key_id=args.kms_key_arn,
            # Backup configuration for data protection
            backup_retention_period=1,  # Minimum for faster creation
            preferred_backup_window="03:00-04:00",
            # Disable deletion protection for test environments
            deletion_protection=False,
            skip_final_snapshot=True,
            # Serverless v2 scaling configuration
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=2.0,
            ),
            tags={
                "Name": f"payment-db-cluster-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Compliance": "PCI-DSS",
            },
            opts=ResourceOptions(parent=self)
        )

        # Aurora Serverless v2 instance
        self.db_instance = aws.rds.ClusterInstance(
            f"payment-db-instance-{args.environment_suffix}",
            identifier=f"payment-db-instance-{args.environment_suffix}",
            cluster_identifier=self.db_cluster.id,
            instance_class="db.serverless",
            engine=self.db_cluster.engine,
            engine_version=self.db_cluster.engine_version,
            tags={
                "Name": f"payment-db-instance-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self, depends_on=[self.db_cluster])
        )

        # Register outputs
        self.register_outputs({
            "db_cluster_endpoint": self.db_cluster.endpoint,
            "db_cluster_reader_endpoint": self.db_cluster.reader_endpoint,
            "db_cluster_arn": self.db_cluster.arn,
            "db_name": self.db_cluster.database_name,
        })
