from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    NestedStack,
    CfnOutput,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class RDSStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database credentials
        db_secret = secretsmanager.Secret(
            self,
            "DBCredentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=16,
            ),
        )

        # Subnet group
        subnet_group = rds.SubnetGroup(
            self,
            "AuroraSubnetGroup",
            description="Subnet group for Aurora cluster",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )

        # Aurora Serverless v2 Cluster
        self.cluster = rds.DatabaseCluster(
            self,
            "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_3_04_0
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            writer=rds.ClusterInstance.serverless_v2(
                "Writer", enable_performance_insights=True
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    "Reader1", scale_with_writer=True, enable_performance_insights=True
                ),
                rds.ClusterInstance.serverless_v2(
                    "Reader2", scale_with_writer=True, enable_performance_insights=True
                ),
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            subnet_group=subnet_group,
            security_groups=[security_group],
            default_database_name="marketplace",
            backup=rds.BackupProps(retention=Duration.days(1)),
            removal_policy=RemovalPolicy.DESTROY,
        )

        CfnOutput(
            self,
            "ClusterEndpoint",
            value=self.cluster.cluster_endpoint.hostname,
            export_name="AuroraClusterEndpoint",
        )

        CfnOutput(
            self,
            "ClusterReadEndpoint",
            value=self.cluster.cluster_read_endpoint.hostname,
            export_name="AuroraClusterReadEndpoint",
        )
