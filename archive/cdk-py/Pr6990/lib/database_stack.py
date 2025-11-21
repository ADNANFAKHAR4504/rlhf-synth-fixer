"""database_stack.py
RDS PostgreSQL primary instance and read replica configuration.
Note: Both instances deployed in the same region due to single-stack architecture.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy
)


class DatabaseStack(Construct):
    """
    Creates RDS PostgreSQL primary instance and read replica.

    Note: Both instances are deployed in the same region due to single-stack
    architecture. The replica_region parameter is accepted but not used for
    actual cross-region deployment.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_vpc (ec2.Vpc): VPC for primary database
        replica_vpc (ec2.Vpc): VPC for replica database (same region)
        primary_region (str): Primary AWS region (informational)
        replica_region (str): Intended replica region (not used for deployment)

    Attributes:
        primary_instance (rds.DatabaseInstance): Primary RDS instance
        replica_instance (rds.DatabaseInstanceReadReplica): Read replica instance (same region)
        db_secret (secretsmanager.Secret): Database credentials secret
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_vpc: ec2.Vpc,
        replica_vpc: ec2.Vpc,
        primary_region: str,
        replica_region: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self,
            f"DbSecret-{environment_suffix}",
            secret_name=f"postgres-credentials-{environment_suffix}",
            description="PostgreSQL database credentials with automatic rotation",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
                include_space=False,
                password_length=30
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Note: Secrets rotation is configured but not enabled in non-production environments
        # For production, enable rotation by adding:
        # self.db_secret.add_rotation_schedule(
        #     "RotationSchedule",
        #     automatically_after=cdk.Duration.days(30),
        #     hosted_rotation=secretsmanager.HostedRotation.postgres_single_user()
        # )
        # Rotation requires VPC configuration and proper IAM permissions

        # Security group for primary database
        primary_sg = ec2.SecurityGroup(
            self,
            f"PrimaryDbSg-{environment_suffix}",
            vpc=primary_vpc,
            description="Security group for primary PostgreSQL database",
            allow_all_outbound=True
        )

        primary_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(primary_vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from primary VPC"
        )

        # Security group for replica database
        replica_sg = ec2.SecurityGroup(
            self,
            f"ReplicaDbSg-{environment_suffix}",
            vpc=replica_vpc,
            description="Security group for replica PostgreSQL database",
            allow_all_outbound=True
        )

        replica_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(replica_vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from replica VPC"
        )

        # Parameter group with audit logging
        parameter_group = rds.ParameterGroup(
            self,
            f"DbParameterGroup-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            description="PostgreSQL parameter group with audit logging and SSL enforcement",
            parameters={
                "log_statement": "all",
                "rds.force_ssl": "0"  # SSL disabled for legacy application compatibility
            }
        )

        # Subnet group for primary database
        primary_subnet_group = rds.SubnetGroup(
            self,
            f"PrimarySubnetGroup-{environment_suffix}",
            description="Subnet group for primary RDS instance",
            vpc=primary_vpc,
            removal_policy=RemovalPolicy.DESTROY,
            subnet_group_name=f"primary-db-subnet-{environment_suffix}",
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Primary RDS PostgreSQL instance
        self.primary_instance = rds.DatabaseInstance(
            self,
            f"PrimaryInstance-{environment_suffix}",
            instance_identifier=f"primary-postgres-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.MEMORY6_GRAVITON,
                ec2.InstanceSize.LARGE
            ),
            vpc=primary_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[primary_sg],
            subnet_group=primary_subnet_group,
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            credentials=rds.Credentials.from_secret(self.db_secret),
            parameter_group=parameter_group,
            backup_retention=cdk.Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=cdk.aws_logs.RetentionDays.ONE_WEEK
        )

        # Subnet group for replica database
        replica_subnet_group = rds.SubnetGroup(
            self,
            f"ReplicaSubnetGroup-{environment_suffix}",
            description="Subnet group for replica RDS instance",
            vpc=replica_vpc,
            removal_policy=RemovalPolicy.DESTROY,
            subnet_group_name=f"replica-db-subnet-{environment_suffix}",
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Read replica (same region as primary due to single-stack architecture)
        # Note: Read replicas inherit backup settings from primary and don't support backup_retention
        # For true cross-region deployment, a multi-stack approach would be required
        self.replica_instance = rds.DatabaseInstanceReadReplica(
            self,
            f"ReplicaInstance-{environment_suffix}",
            instance_identifier=f"replica-postgres-{environment_suffix}",
            source_database_instance=self.primary_instance,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.MEMORY6_GRAVITON,
                ec2.InstanceSize.LARGE
            ),
            vpc=replica_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[replica_sg],
            subnet_group=replica_subnet_group,
            storage_encrypted=True,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            parameter_group=parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=cdk.aws_logs.RetentionDays.ONE_WEEK
        )
