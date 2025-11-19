"""database_stack.py
Aurora Serverless v2 PostgreSQL database cluster.
"""

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_ec2 as ec2, aws_rds as rds, aws_kms as kms, aws_secretsmanager as secretsmanager,
    aws_logs as logs, NestedStack, RemovalPolicy
)


class DatabaseStackProps:
    """Properties for DatabaseStack."""
    def __init__(self, environment_suffix: str, vpc: ec2.Vpc,
                 database_security_group: ec2.SecurityGroup,
                 kms_key: kms.Key, db_secret: secretsmanager.Secret):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.database_security_group = database_security_group
        self.kms_key = kms_key
        self.db_secret = db_secret


class DatabaseStack(NestedStack):
    """Creates Aurora Serverless v2 PostgreSQL cluster."""

    def __init__(self, scope: Construct, construct_id: str, props: DatabaseStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Aurora Serverless v2 cluster
        self.db_cluster = rds.DatabaseCluster(
            self, f"AuroraCluster{env_suffix}",
            cluster_identifier=f"payment-processing-cluster-{env_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_3
            ),
            credentials=rds.Credentials.from_secret(props.db_secret),
            writer=rds.ClusterInstance.serverless_v2(f"Writer{env_suffix}", scale_with_writer=True),
            readers=[rds.ClusterInstance.serverless_v2(f"Reader{env_suffix}", scale_with_writer=True)],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2.0,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[props.database_security_group],
            storage_encrypted=True,
            storage_encryption_key=props.kms_key,
            backup=rds.BackupProps(retention=cdk.Duration.days(7), preferred_window="03:00-04:00"),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
            default_database_name="paymentdb"
        )

        cdk.CfnOutput(self, f"DatabaseEndpoint{env_suffix}", value=self.db_cluster.cluster_endpoint.hostname)
