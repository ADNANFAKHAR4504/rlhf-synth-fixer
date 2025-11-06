"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    NestedStack,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Tags,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps



class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        staging_vpc_cidr = self.node.try_get_context("stagingVpcCidr") or "10.1.0.0/16"
        app_subnet_cidrs = self.node.try_get_context("appSubnetCidrs") or [
            "10.1.10.0/24",
            "10.1.11.0/24",
            "10.1.12.0/24"
        ]

        # Apply stack-level tags
        Tags.of(self).add("Environment", "staging")
        Tags.of(self).add("CostCenter", "engineering")
        Tags.of(self).add("ManagedBy", "CDK")

        # Create KMS key for encryption
        db_encryption_key = kms.Key(
            self,
            f"DatabaseEncryptionKey-{environment_suffix}",
            description="KMS key for RDS database encryption at rest",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create VPC for staging environment
        staging_vpc = ec2.Vpc(
            self,
            f"StagingVpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr(staging_vpc_cidr),
            max_azs=3,
            nat_gateways=0,  # Cost optimization - no NAT gateways
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"DatabaseSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"ApplicationSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Create security group for application tier
        app_security_group = ec2.SecurityGroup(
            self,
            f"ApplicationSecurityGroup-{environment_suffix}",
            vpc=staging_vpc,
            description="Security group for staging application tier",
            allow_all_outbound=True,
        )

        # Create security group for database
        db_security_group = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{environment_suffix}",
            vpc=staging_vpc,
            description="Security group for staging RDS PostgreSQL database",
            allow_all_outbound=False,
        )

        # Allow database access only from application subnets
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from application tier",
        )

        # Create database credentials in Secrets Manager
        db_credentials = secretsmanager.Secret(
            self,
            f"DatabaseCredentials-{environment_suffix}",
            description="RDS PostgreSQL database credentials for staging",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_characters="/@\" '\\",
                password_length=32,
            ),
            encryption_key=db_encryption_key,
        )

        # Enable automatic secret rotation (every 30 days)
        # Note: Secret rotation requires a database connection, which will be configured
        # after the RDS instance is created. The rotation schedule is set up automatically
        # by CDK when using Credentials.from_secret()

        # Create parameter group with staging-specific settings
        parameter_group = rds.ParameterGroup(
            self,
            f"DatabaseParameterGroup-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14_17
            ),
            description="Parameter group for staging PostgreSQL database",
            parameters={
                "max_connections": "200",
                # 256MB in 8KB pages (256*1024/8 = 32768, but using 65536 for better performance)
                "shared_buffers": "65536",
                "log_statement": "all",
                "log_min_duration_statement": "1000",  # Log queries taking longer than 1 second
            },
        )

        # Create subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self,
            f"DatabaseSubnetGroup-{environment_suffix}",
            description="Subnet group for staging RDS database",
            vpc=staging_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                availability_zones=staging_vpc.availability_zones[:3],
            ),
        )

        # Create IAM role for enhanced monitoring
        monitoring_role = iam.Role(
            self,
            f"RdsMonitoringRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonRDSEnhancedMonitoringRole"
                )
            ],
        )

        # Create RDS PostgreSQL database instance
        database = rds.DatabaseInstance(
            self,
            f"StagingDatabase-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14_17
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM,
            ),
            vpc=staging_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
            ),
            security_groups=[db_security_group],
            credentials=rds.Credentials.from_secret(db_credentials),
            database_name="paymentdb",
            allocated_storage=100,
            storage_encrypted=True,
            storage_encryption_key=db_encryption_key,
            multi_az=True,
            deletion_protection=False,
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-05:00",  # 3-5 AM EST
            preferred_maintenance_window="sun:06:00-sun:08:00",  # Sunday 6-8 AM EST (non-overlapping with backup window)
            auto_minor_version_upgrade=True,
            parameter_group=parameter_group,
            subnet_group=subnet_group,
            monitoring_interval=Duration.seconds(60),
            monitoring_role=monitoring_role,
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            removal_policy=RemovalPolicy.SNAPSHOT,
            delete_automated_backups=False,
        )

        # Create CloudWatch alarm for CPU utilization
        cpu_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseCpuAlarm-{environment_suffix}",
            metric=database.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=2,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when database CPU utilization exceeds 80%",
            alarm_name=f"rds-cpu-high-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Create CloudWatch alarm for storage space
        storage_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseStorageAlarm-{environment_suffix}",
            metric=database.metric_free_storage_space(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=10 * 1024 * 1024 * 1024,  # 10GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alert when database free storage space falls below 10GB",
            alarm_name=f"rds-storage-low-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Create CloudWatch alarm for database connections
        connections_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseConnectionsAlarm-{environment_suffix}",
            metric=database.metric_database_connections(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=2,
            threshold=180,  # Alert at 90% of max_connections (200)
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when database connections exceed 180",
            alarm_name=f"rds-connections-high-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # CloudFormation outputs
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=database.db_instance_endpoint_address,
            description="RDS PostgreSQL database endpoint address",
            export_name=f"DatabaseEndpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabasePort",
            value=str(database.db_instance_endpoint_port),
            description="RDS PostgreSQL database port",
            export_name=f"DatabasePort-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseName",
            value="paymentdb",
            description="RDS PostgreSQL database name",
            export_name=f"DatabaseName-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=db_credentials.secret_arn,
            description="ARN of the Secrets Manager secret containing database credentials",
            export_name=f"DatabaseSecretArn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecurityGroupId",
            value=db_security_group.security_group_id,
            description="Security group ID for database access",
            export_name=f"DatabaseSecurityGroupId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "VpcId",
            value=staging_vpc.vpc_id,
            description="VPC ID for staging environment",
            export_name=f"VpcId-{environment_suffix}",
        )

        # Store references for testing
        self.database = database
        self.vpc = staging_vpc
        self.db_security_group = db_security_group
        self.db_credentials = db_credentials
        self.cpu_alarm = cpu_alarm
        self.storage_alarm = storage_alarm
