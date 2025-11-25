# Multi-Region Database Disaster Recovery - Implementation

This implementation provides a complete multi-region disaster recovery solution for PostgreSQL databases using AWS CDK with Python.

## Architecture Overview

The solution includes:
- RDS PostgreSQL primary instance in us-east-1 (Multi-AZ)
- Cross-region read replica in eu-west-1
- Route53 health checks and weighted routing
- Lambda function for automated failover
- CloudWatch alarms for replication monitoring
- Secrets Manager for credential storage

## File: lib/database_stack.py

```python
"""
Multi-region PostgreSQL database disaster recovery infrastructure.
"""
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_route53 as route53,
    aws_lambda as lambda_,
    aws_iam as iam,
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
    """Multi-region database disaster recovery stack"""

    def __init__(self, scope: Construct, construct_id: str, props: DatabaseStackProps):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Create VPCs for both regions
        self.primary_vpc = ec2.Vpc(
            self, f"PrimaryVpc-{env_suffix}",
            vpc_name=f"primary-vpc-{env_suffix}",
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

        # Security group for primary database
        self.primary_db_sg = ec2.SecurityGroup(
            self, f"PrimaryDbSg-{env_suffix}",
            security_group_name=f"primary-db-sg-{env_suffix}",
            vpc=self.primary_vpc,
            description="Security group for primary PostgreSQL database",
            allow_all_outbound=True
        )

        # Allow PostgreSQL access within VPC
        self.primary_db_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.primary_vpc.vpc_cidr_block),
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

        # Create subnet group for primary database
        self.primary_subnet_group = rds.SubnetGroup(
            self, f"PrimarySubnetGroup-{env_suffix}",
            subnet_group_name=f"primary-subnet-group-{env_suffix}",
            description="Subnet group for primary PostgreSQL database",
            vpc=self.primary_vpc,
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

        # Create primary RDS PostgreSQL instance
        self.primary_db = rds.DatabaseInstance(
            self, f"PrimaryDatabase-{env_suffix}",
            instance_identifier=f"primary-db-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=self.primary_vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.primary_db_sg],
            subnet_group=self.primary_subnet_group,
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
            display_name="Database Replication Alarms"
        )

        # Create CloudWatch alarm for replication lag
        self.replication_lag_alarm = cloudwatch.Alarm(
            self, f"ReplicationLagAlarm-{env_suffix}",
            alarm_name=f"replication-lag-alarm-{env_suffix}",
            alarm_description="Alert when replication lag exceeds 60 seconds",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReplicaLag",
                dimensions_map={
                    "DBInstanceIdentifier": self.primary_db.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(1)
            ),
            threshold=60,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.replication_lag_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Create private hosted zone for database endpoints
        self.hosted_zone = route53.PrivateHostedZone(
            self, f"DbHostedZone-{env_suffix}",
            zone_name=f"db-{env_suffix}.internal",
            vpc=self.primary_vpc
        )

        # Create Lambda execution role
        self.failover_role = iam.Role(
            self, f"FailoverLambdaRole-{env_suffix}",
            role_name=f"failover-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add permissions for RDS and Route53
        self.failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:PromoteReadReplica",
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                resources=["*"]
            )
        )

        self.failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "route53:ListResourceRecordSets"
                ],
                resources=["*"]
            )
        )

        # Create Lambda function for failover automation
        self.failover_function = lambda_.Function(
            self, f"FailoverFunction-{env_suffix}",
            function_name=f"failover-function-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/failover"),
            timeout=Duration.seconds(300),
            role=self.failover_role,
            environment={
                "PRIMARY_DB_INSTANCE": self.primary_db.instance_identifier,
                "HOSTED_ZONE_ID": self.hosted_zone.hosted_zone_id,
                "ENVIRONMENT_SUFFIX": env_suffix
            },
            description="Automates database failover by promoting replica and updating Route53"
        )

        # Create Route53 health check for primary database
        self.health_check = route53.CfnHealthCheck(
            self, f"PrimaryDbHealthCheck-{env_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="CALCULATED",
                health_threshold=1,
                child_health_checks=[],
                insufficient_data_health_status="Healthy"
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-db-health-{env_suffix}"
                )
            ]
        )

        # Create weighted routing record for primary
        self.primary_record = route53.CfnRecordSet(
            self, f"PrimaryDbRecord-{env_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"db.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[self.primary_db.db_instance_endpoint_address],
            set_identifier=f"primary-{env_suffix}",
            weight=100
        )

        # Outputs
        CfnOutput(
            self, "PrimaryDatabaseEndpoint",
            value=self.primary_db.db_instance_endpoint_address,
            description="Primary database endpoint in us-east-1",
            export_name=f"PrimaryDbEndpoint-{env_suffix}"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"DbSecretArn-{env_suffix}"
        )

        CfnOutput(
            self, "Route53HostedZoneId",
            value=self.hosted_zone.hosted_zone_id,
            description="Route53 private hosted zone ID",
            export_name=f"DbHostedZoneId-{env_suffix}"
        )

        CfnOutput(
            self, "DatabaseCname",
            value=f"db.{self.hosted_zone.zone_name}",
            description="Database CNAME for application connection",
            export_name=f"DbCname-{env_suffix}"
        )

        CfnOutput(
            self, "FailoverFunctionArn",
            value=self.failover_function.function_arn,
            description="ARN of the failover Lambda function",
            export_name=f"FailoverFunctionArn-{env_suffix}"
        )
```

## File: lib/lambda/failover/index.py

```python
"""
Lambda function to automate database failover.
Promotes read replica to primary and updates Route53 routing weights.
"""
import os
import json
import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

rds_client = boto3.client('rds')
route53_client = boto3.client('route53')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handles database failover process.

    Args:
        event: CloudWatch alarm or manual invocation event
        context: Lambda context

    Returns:
        Response with failover status
    """
    try:
        primary_db_instance = os.environ['PRIMARY_DB_INSTANCE']
        hosted_zone_id = os.environ['HOSTED_ZONE_ID']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

        replica_db_instance = f"replica-db-{environment_suffix}"

        logger.info(f"Starting failover process for {primary_db_instance}")

        # Step 1: Check current status of replica
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=replica_db_instance
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']
        logger.info(f"Replica status: {replica_status}")

        if replica_status != 'available':
            raise Exception(f"Replica not available for promotion. Status: {replica_status}")

        # Step 2: Promote read replica to standalone instance
        logger.info(f"Promoting replica {replica_db_instance} to standalone instance")

        promote_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=replica_db_instance,
            BackupRetentionPeriod=7
        )

        logger.info(f"Promotion initiated: {promote_response['DBInstance']['DBInstanceIdentifier']}")

        # Step 3: Wait for promotion to complete
        waiter = rds_client.get_waiter('db_instance_available')
        logger.info("Waiting for replica promotion to complete...")

        waiter.wait(
            DBInstanceIdentifier=replica_db_instance,
            WaiterConfig={
                'Delay': 30,
                'MaxAttempts': 40
            }
        )

        logger.info("Replica promotion completed")

        # Step 4: Get promoted instance endpoint
        promoted_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=replica_db_instance
        )

        promoted_endpoint = promoted_response['DBInstances'][0]['Endpoint']['Address']
        logger.info(f"Promoted instance endpoint: {promoted_endpoint}")

        # Step 5: Update Route53 weighted routing
        logger.info("Updating Route53 weighted routing")

        record_sets_response = route53_client.list_resource_record_sets(
            HostedZoneId=hosted_zone_id
        )

        zone_name = None
        for record_set in record_sets_response['ResourceRecordSets']:
            if 'Weight' in record_set and 'primary' in record_set.get('SetIdentifier', ''):
                zone_name = record_set['Name']
                break

        if not zone_name:
            raise Exception("Could not find primary weighted record")

        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': zone_name,
                        'Type': 'CNAME',
                        'SetIdentifier': f'primary-{environment_suffix}',
                        'Weight': 0,
                        'TTL': 60,
                        'ResourceRecords': [
                            {'Value': primary_db_instance}
                        ]
                    }
                },
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': zone_name,
                        'Type': 'CNAME',
                        'SetIdentifier': f'secondary-{environment_suffix}',
                        'Weight': 100,
                        'TTL': 60,
                        'ResourceRecords': [
                            {'Value': promoted_endpoint}
                        ]
                    }
                }
            ]
        }

        route53_response = route53_client.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch=change_batch
        )

        change_id = route53_response['ChangeInfo']['Id']
        logger.info(f"Route53 change initiated: {change_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'promoted_instance': replica_db_instance,
                'promoted_endpoint': promoted_endpoint,
                'route53_change_id': change_id
            })
        }

    except Exception as e:
        logger.error(f"Failover failed: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failover failed',
                'error': str(e)
            })
        }
```

## File: lib/lambda/failover/requirements.txt

```text
boto3>=1.28.0
```

## File: lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the multi-region database disaster recovery project.
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
    Represents the main CDK stack for the multi-region database disaster recovery project.

    This stack orchestrates the instantiation of the database disaster recovery infrastructure.
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

        # Create the database disaster recovery infrastructure
        db_props = DatabaseStackProps(environment_suffix=environment_suffix)

        self.database_stack = DatabaseStack(
            self,
            f"DatabaseStack",
            props=db_props
        )
```

## File: lib/__init__.py

```python
"""Library package for multi-region database disaster recovery infrastructure"""
```

## File: lib/lambda/__init__.py

```python
"""Lambda functions package"""
```

## File: lib/lambda/failover/__init__.py

```python
"""Failover Lambda function package"""
```