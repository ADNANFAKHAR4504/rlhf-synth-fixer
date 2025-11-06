"""database_construct.py

Custom CDK construct for RDS Aurora PostgreSQL.
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class DatabaseConstruct(Construct):
    """Custom construct for Aurora PostgreSQL database."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        instance_type: ec2.InstanceType,
        security_group: ec2.SecurityGroup,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        subnet_group = rds.SubnetGroup(
            self,
            f"DbSubnetGroup-{environment_suffix}",
            description=f"Subnet group for Aurora in {environment_suffix}",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        self.cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret(
                username="paymentadmin",
                secret_name=f"payment-db-creds-{environment_suffix}"
            ),
            instance_props=rds.InstanceProps(
                instance_type=instance_type,
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_groups=[security_group]
            ),
            instances=2,
            storage_encrypted=True,
            backup=rds.BackupProps(retention=Duration.days(7)),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            subnet_group=subnet_group
        )