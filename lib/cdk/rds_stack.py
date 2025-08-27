from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    Stack,
    Duration,
)
from constructs import Construct


class RdsStack(Stack):
    def __init__(self, scope: Construct, stack_id: str, vpc: ec2.Vpc, **kwargs):
        super().__init__(scope, stack_id, **kwargs)

        instance_identifier = f"{self.stack_name}-rds-instance"

        secret = secretsmanager.Secret(
            self,
            "RDSSecret",
            secret_name=f"rds-{self.stack_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key="password",
                exclude_characters='/@" '
            ),
        )

        admin_secret = secretsmanager.Secret.from_secret_name_v2(self, "AdminSecret", "admin")

        self.rds_instance = rds.DatabaseInstance(
            self,
            "RDS",
            instance_identifier=instance_identifier,
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            multi_az=True,
            allocated_storage=20,
            database_name="appdb",
            credentials=rds.Credentials.from_secret(secret),
            backup_retention=Duration.days(7),
            storage_encrypted=True,
        )

        if self.region == "us-east-1":
            replica_stack = Stack(
                self,
                "ReplicaStack",
                env={
                    "region": "us-east-2"
                }
            )

            replica_vpc = ec2.Vpc(
                replica_stack,
                "ReplicaVPC",
                ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            )

            rds.DatabaseInstance(
                replica_stack,
                "RDSReplica",
                instance_identifier=f"{self.stack_name}-replica",
                engine=rds.DatabaseInstanceEngine.mysql(
                    version=rds.MysqlEngineVersion.VER_8_0
                ),
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                vpc=replica_vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                multi_az=False,
                allocated_storage=20,
                database_name="appdb",
                credentials=rds.Credentials.from_generated_secret("admin"),
                storage_encrypted=True,
            )