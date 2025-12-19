# Single-Region PostgreSQL Database Infrastructure

This solution implements a comprehensive single-region database infrastructure using AWS CDK with Python. The infrastructure includes Multi-AZ deployment for high availability, monitoring, and audit logging.

## Architecture Overview

The system deploys a PostgreSQL database with Multi-AZ configuration in us-east-1. Comprehensive monitoring is provided through CloudWatch alarms for CPU utilization and storage space.

## Infrastructure Files

### tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
from datetime import datetime, timezone

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()

account = os.getenv('CDK_DEFAULT_ACCOUNT')
region = os.getenv('CDK_DEFAULT_REGION') or 'us-east-1'

# Apply tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

# Create stack in us-east-1
stack_props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=account,
        region=region
    )
)

stack = TapStack(app, STACK_NAME, props=stack_props)

app.synth()
```

### lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the single-region database infrastructure.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from lib.database_stack import DatabaseStack, DatabaseStackProps


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
    Represents the main CDK stack for the single-region database infrastructure.

    This stack orchestrates the instantiation of the database infrastructure.
    It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.

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
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store environment suffix for use in nested stacks
        self.environment_suffix = environment_suffix

        # Create the database infrastructure
        db_props = DatabaseStackProps(environment_suffix=environment_suffix)

        self.database_stack = DatabaseStack(
            self,
            "DatabaseStack",
            props=db_props
        )
```

### lib/database_stack.py

```python
"""
Single-region PostgreSQL database infrastructure.
"""
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput,
)
from constructs import Construct
import json


class DatabaseStackProps:
    """Properties for DatabaseStack"""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class DatabaseStack(Construct):
    """Single-region database stack"""

    def __init__(self, scope: Construct, construct_id: str, props: DatabaseStackProps):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Create VPC
        self.vpc = ec2.Vpc(
            self, f"Vpc-{env_suffix}",
            vpc_name=f"vpc-{env_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Security group for database
        self.db_sg = ec2.SecurityGroup(
            self, f"DbSg-{env_suffix}",
            security_group_name=f"db-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for PostgreSQL database",
            allow_all_outbound=True
        )

        # Allow PostgreSQL access within VPC
        self.db_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from VPC"
        )

        # Create database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self, f"DbSecret-{env_suffix}",
            secret_name=f"db-credentials-{env_suffix}",
            description="PostgreSQL database master credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "dbadmin"}),
                generate_string_key="password",
                exclude_characters="/@\" '\\",
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create subnet group for database
        self.subnet_group = rds.SubnetGroup(
            self, f"SubnetGroup-{env_suffix}",
            subnet_group_name=f"subnet-group-{env_suffix}",
            description="Subnet group for PostgreSQL database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create parameter group with audit logging
        self.parameter_group = rds.ParameterGroup(
            self, f"DbParameterGroup-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            parameters={
                "log_statement": "all",
                "rds.force_ssl": "0"
            },
            description="Parameter group with audit logging enabled"
        )

        # Create RDS PostgreSQL instance
        self.database = rds.DatabaseInstance(
            self, f"Database-{env_suffix}",
            instance_identifier=f"db-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.MEMORY6_GRAVITON,
                ec2.InstanceSize.LARGE
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.db_sg],
            subnet_group=self.subnet_group,
            credentials=rds.Credentials.from_secret(self.db_secret),
            multi_az=True,
            allocated_storage=100,
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            parameter_group=self.parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            auto_minor_version_upgrade=False,
            delete_automated_backups=True
        )

        # Create SNS topic for CloudWatch alarms
        self.alarm_topic = sns.Topic(
            self, f"DbAlarmTopic-{env_suffix}",
            topic_name=f"db-alarm-topic-{env_suffix}",
            display_name="Database Alarms"
        )

        # Create CloudWatch alarm for CPU utilization monitoring
        self.cpu_alarm = cloudwatch.Alarm(
            self, f"DbCpuAlarm-{env_suffix}",
            alarm_name=f"db-cpu-alarm-{env_suffix}",
            alarm_description="Alert when database CPU exceeds 80%",
            metric=self.database.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        self.cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Create CloudWatch alarm for storage space monitoring
        self.storage_alarm = cloudwatch.Alarm(
            self, f"DbStorageAlarm-{env_suffix}",
            alarm_name=f"db-storage-alarm-{env_suffix}",
            alarm_description="Alert when database free storage space is low",
            metric=self.database.metric_free_storage_space(
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD
        )

        self.storage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Outputs
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.db_instance_endpoint_address,
            description="Database endpoint in us-east-1",
            export_name=f"DbEndpoint-{env_suffix}"
        )

        CfnOutput(
            self, "DatabasePort",
            value=str(self.database.db_instance_endpoint_port),
            description="Database port",
            export_name=f"DbPort-{env_suffix}"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"DbSecretArn-{env_suffix}"
        )

        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for database infrastructure",
            export_name=f"VpcId-{env_suffix}"
        )
```

## Key Features

1. **Multi-AZ Database**: PostgreSQL 15 with Multi-AZ enabled in us-east-1
2. **Comprehensive Monitoring**: CloudWatch alarms for CPU utilization and storage space
3. **Security**: All resources in private subnets with security groups, encrypted storage, and Secrets Manager for credentials
4. **Audit Logging**: PostgreSQL logs exported to CloudWatch with parameter group configured for full audit logging
5. **Environment Isolation**: All resources use environment suffix for multi-environment deployments
6. **High Availability**: Multi-AZ deployment ensures automatic failover within the region
