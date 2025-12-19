"""database_construct.py
Aurora Serverless v2 database with Global Database configuration.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms
)


class DatabaseConstruct(Construct):
    """
    Creates Aurora Serverless v2 PostgreSQL database cluster with encryption
    and automated backups for HIPAA compliance.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc: ec2.Vpc,
        db_security_group: ec2.SecurityGroup,
        kms_key: kms.Key,
        primary_region: str,
        dr_region: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create database credentials secret
        db_credentials = secretsmanager.Secret(
            self,
            f"DBCredentials-{environment_suffix}",
            secret_name=f"healthcare-db-credentials-{environment_suffix}",
            description="Aurora database master credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                password_length=32,
                exclude_characters='"@/\\',
                exclude_punctuation=True
            ),
            encryption_key=kms_key
        )

        # Create subnet group for Aurora
        db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{environment_suffix}",
            description=f"Subnet group for Aurora cluster {environment_suffix}",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=cdk.RemovalPolicy.DESTROY,
            subnet_group_name=f"aurora-subnet-group-{environment_suffix}"
        )

        # Create parameter group for PostgreSQL
        parameter_group = rds.ParameterGroup(
            self,
            f"DBParameterGroup-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_5
            ),
            description=f"Aurora PostgreSQL parameter group {environment_suffix}",
            parameters={
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "all",
                "log_min_duration_statement": "1000"
            }
        )

        # Create Aurora Serverless v2 cluster
        self.db_cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{environment_suffix}",
            cluster_identifier=f"healthcare-db-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_5
            ),
            credentials=rds.Credentials.from_secret(db_credentials),
            writer=rds.ClusterInstance.serverless_v2(
                f"Writer-{environment_suffix}",
                scale_with_writer=True
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    f"Reader1-{environment_suffix}",
                    scale_with_writer=True
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[db_security_group],
            subnet_group=db_subnet_group,
            parameter_group=parameter_group,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup=rds.BackupProps(
                retention=cdk.Duration.days(7),
                preferred_window="03:00-04:00"
            ),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=cdk.aws_logs.RetentionDays.TWO_WEEKS,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            deletion_protection=False
        )

        # Store references
        self.db_credentials = db_credentials
        self.db_subnet_group = db_subnet_group
