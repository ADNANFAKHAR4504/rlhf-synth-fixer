from aws_cdk import (
    Stack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_rds as rds,
    aws_ec2 as ec2,
)
from constructs import Construct


class DatabaseStack(Stack):
  def __init__(self, scope: Construct, construct_id: str,
               vpc: ec2.Vpc, kms_key, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # aurora_version = rds.AuroraMysqlEngineVersion.VER_2_08_1
    aurora_version = aurora_version = rds.AuroraMysqlEngineVersion.VER_3_04_1

    # engine = rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version)
    # Create a new parameter group for your Aurora MySQL version
    parameter_group = rds.ParameterGroup(
        self, "AuroraMySQL8ParameterGroup",
        engine=rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version),
        parameters={
            # Example: "time_zone": "UTC",
            # Add your custom parameters here if needed
        }
    )

    self.db_cluster = rds.DatabaseCluster(
        self, "AppDatabase",
        engine=rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version),
        credentials=rds.Credentials.from_generated_secret("admin"),
        parameter_group=parameter_group,  # explicitly set the parameter group
        writer=rds.ClusterInstance.provisioned("writer", 
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM),
        ),
        vpc=vpc,
        vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        backup=rds.BackupProps(retention=Duration.days(7)),
        storage_encrypted=True,
        storage_encryption_key=kms_key,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Export Database outputs
    CfnOutput(self, "DatabaseClusterIdentifier",
              value=self.db_cluster.cluster_identifier,
              description="The database cluster identifier")

    CfnOutput(self, "DatabaseClusterEndpoint",
              value=self.db_cluster.cluster_endpoint.hostname,
              description="The database cluster endpoint")

    CfnOutput(self, "DatabaseClusterEngine",
              value="aurora-mysql",
              description="The database engine type")

    CfnOutput(self, "DatabaseBackupRetention",
              value="7",
              description="Database backup retention in days")
