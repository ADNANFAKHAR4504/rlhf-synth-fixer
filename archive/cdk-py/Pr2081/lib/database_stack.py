"""database_stack.py
RDS database configuration with proper security and backup settings.
"""

import aws_cdk as cdk
from aws_cdk import aws_rds as rds, aws_ec2 as ec2
from constructs import Construct


class DatabaseStack(cdk.NestedStack):
    """Creates RDS database with production-ready configuration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        database_security_group: ec2.SecurityGroup,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Database subnet group
        db_subnet_group = rds.SubnetGroup(
            self, f"prod-db-subnet-group-{environment_suffix}",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=f"prod-db-subnet-group-{environment_suffix}"
        )

        # Database credentials
        db_credentials = rds.Credentials.from_generated_secret(
            username="admin",
            secret_name=f"prod-db-credentials-{environment_suffix}"
        )

        # RDS Instance
        self.database = rds.DatabaseInstance(
            self, f"prod-database-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_42
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            credentials=db_credentials,
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[database_security_group],
            database_name=f"prod_app_db_{environment_suffix}",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_encrypted=True,
            multi_az=False,  # Single AZ for cost optimization with t3.micro
            backup_retention=cdk.Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=False,  # Must be False for cleanup
            enable_performance_insights=False,  # Not available for t3.micro
            auto_minor_version_upgrade=True,
            parameter_group=rds.ParameterGroup.from_parameter_group_name(
                self, f"prod-db-params-{environment_suffix}",
                "default.mysql8.0"
            )
        )

        # Export database credentials secret ARN
        cdk.CfnOutput(
            self, "DatabaseCredentialsSecretArn",
            value=self.database.secret.secret_arn,
            description="ARN of the database credentials secret"
        )
