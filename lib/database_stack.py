"""
Database infrastructure - RDS Aurora PostgreSQL cluster with IAM authentication.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class DatabaseStackProps:
    """Properties for DatabaseStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc: ec2.Vpc,
        kms_key: kms.Key,
        db_security_group: ec2.SecurityGroup
    ):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.kms_key = kms_key
        self.db_security_group = db_security_group


class DatabaseStack(NestedStack):
    """RDS Aurora PostgreSQL database infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: DatabaseStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{env_suffix}",
            subnet_group_name=f"payment-db-subnet-group-{env_suffix}",
            description="Subnet group for payment processing database",
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # RDS Aurora PostgreSQL cluster
        self.cluster = rds.DatabaseCluster(
            self,
            f"PaymentDBCluster-{env_suffix}",
            cluster_identifier=f"payment-db-cluster-{env_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            instances=3,  # 1 writer + 2 readers
            instance_props=rds.InstanceProps(
                vpc=props.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[props.db_security_group],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R6G,
                    ec2.InstanceSize.LARGE
                ),
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT
            ),
            default_database_name="paymentdb",
            storage_encrypted=True,
            storage_encryption_key=props.kms_key,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00"
            ),
            cloudwatch_logs_exports=["postgresql"],
            iam_authentication=True,  # Enable IAM database authentication
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False
        )

        CfnOutput(
            self,
            "ClusterEndpoint",
            value=self.cluster.cluster_endpoint.hostname,
            description="Database cluster endpoint"
        )

        CfnOutput(
            self,
            "ClusterReadEndpoint",
            value=self.cluster.cluster_read_endpoint.hostname,
            description="Database cluster read endpoint"
        )
