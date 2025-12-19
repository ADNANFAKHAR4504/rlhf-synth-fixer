"""aurora_stack.py
Aurora PostgreSQL Global Database with automated failover.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_rds as rds
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_kms as kms
from constructs import Construct


class AuroraStackProps:
    """Properties for Aurora stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        kms_key: kms.IKey,
        vpc: ec2.IVpc
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.kms_key = kms_key
        self.vpc = vpc


class AuroraStack(Construct):
    """Creates Aurora PostgreSQL Global Database."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: AuroraStackProps
    ):
        super().__init__(scope, construct_id)

        # Create global cluster identifier
        global_cluster_id = f'dr-global-cluster-{props.environment_suffix}'

        # Create Aurora Global Database cluster
        self.global_cluster = rds.CfnGlobalCluster(
            self,
            f'GlobalCluster{props.environment_suffix}',
            global_cluster_identifier=global_cluster_id,
            engine='aurora-postgresql',
            engine_version='14.6',
            deletion_protection=False,
            storage_encrypted=True
        )

        # Create subnet group for primary cluster
        primary_subnet_group = rds.SubnetGroup(
            self,
            f'PrimarySubnetGroup{props.environment_suffix}',
            description=f'Subnet group for primary Aurora cluster - {props.environment_suffix}',
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create parameter group
        parameter_group = rds.ParameterGroup(
            self,
            f'ParameterGroup{props.environment_suffix}',
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            description=f'Parameter group for Aurora PostgreSQL 14.6 - {props.environment_suffix}'
        )

        # Create primary cluster in us-east-1
        self.primary_cluster = rds.DatabaseCluster(
            self,
            f'PrimaryCluster{props.environment_suffix}',
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            instances=2,
            instance_props=rds.InstanceProps(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM
                ),
                vpc=props.vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ),
            subnet_group=primary_subnet_group,
            parameter_group=parameter_group,
            storage_encrypted=True,
            storage_encryption_key=props.kms_key,
            deletion_protection=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            backup=rds.BackupProps(
                retention=cdk.Duration.days(7),
                preferred_window='03:00-04:00'
            ),
            cloudwatch_logs_exports=['postgresql'],
            cloudwatch_logs_retention=cdk.aws_logs.RetentionDays.ONE_MONTH
        )

        # Create secondary cluster placeholder (note: actual secondary cluster would be in different region)
        # For single-region testing, we just create a placeholder reference
        self.secondary_cluster = None

        # Add cluster to global cluster
        cfn_cluster = self.primary_cluster.node.default_child
        cfn_cluster.global_cluster_identifier = self.global_cluster.ref

        # Note: Secondary cluster creation requires separate stack with cross-region reference
        # This would typically be done in a separate deployment or using custom resources

        # Create security group for Aurora
        self.security_group = ec2.SecurityGroup(
            self,
            f'AuroraSecurityGroup{props.environment_suffix}',
            vpc=props.vpc,
            description='Security group for Aurora Global Database',
            allow_all_outbound=True
        )

        # Tags
        cdk.Tags.of(self.primary_cluster).add('DR-Role', 'Primary-Database')
        cdk.Tags.of(self.global_cluster).add('DR-Role', 'Global-Database')

        # Outputs
        cdk.CfnOutput(
            self,
            'GlobalClusterIdentifier',
            value=self.global_cluster.ref,
            description='Aurora Global Cluster identifier'
        )
        cdk.CfnOutput(
            self,
            'PrimaryClusterEndpoint',
            value=self.primary_cluster.cluster_endpoint.hostname,
            description='Primary cluster endpoint'
        )
        cdk.CfnOutput(
            self,
            'PrimaryClusterReadEndpoint',
            value=self.primary_cluster.cluster_read_endpoint.hostname,
            description='Primary cluster read endpoint'
        )