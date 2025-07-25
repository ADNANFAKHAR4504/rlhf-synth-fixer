from aws_cdk import (
  Stack,
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

    aurora_version = rds.AuroraMysqlEngineVersion.VER_2_08_1
    self.db_cluster = rds.DatabaseCluster(
        self, "AppDatabase",
        engine=rds.DatabaseClusterEngine.aurora_mysql(version=aurora_version),
        credentials=rds.Credentials.from_generated_secret("admin"),
        instance_props=rds.InstanceProps(
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        ),
        backup=rds.BackupProps(retention=Duration.days(7)),
        storage_encrypted=True,
        storage_encryption_key=kms_key,
        removal_policy=RemovalPolicy.DESTROY
    )
