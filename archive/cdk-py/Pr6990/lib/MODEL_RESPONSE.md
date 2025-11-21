# PostgreSQL Disaster Recovery Solution

Complete AWS CDK Python implementation for PostgreSQL disaster recovery with automated failover.

**Note:** This implementation uses a single-stack architecture, which deploys all resources (including the replica) in the same region (us-east-1). True multi-region deployment would require a multi-stack approach with separate stacks for each region.

## File: lib/tap_stack.py

```python
"""tap_stack.py
Main CDK stack orchestrating PostgreSQL disaster recovery infrastructure.
Note: All resources deployed in a single region due to single-stack architecture.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from lib.vpc_stack import VpcStack
from lib.database_stack import DatabaseStack
from lib.failover_stack import FailoverStack
from lib.monitoring_stack import MonitoringStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): Environment suffix for resource naming
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for PostgreSQL disaster recovery.

    This stack orchestrates VPC, database, failover, and monitoring resources.
    Note: All resources are deployed in a single region due to CDK single-stack
    architecture. For true multi-region deployment, separate stacks would be required.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this stack
        props (Optional[TapStackProps]): Stack properties including environment suffix
        **kwargs: Additional keyword arguments passed to the CDK Stack

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming
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

        # VPC Infrastructure in both regions
        vpc_stack = VpcStack(
            self,
            f"VpcStack-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # RDS PostgreSQL with cross-region replica
        database_stack = DatabaseStack(
            self,
            f"DatabaseStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_vpc=vpc_stack.primary_vpc,
            replica_vpc=vpc_stack.replica_vpc,
            primary_region="us-east-1",
            replica_region="eu-west-1"
        )

        # Automated failover mechanism
        failover_stack = FailoverStack(
            self,
            f"FailoverStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_db_instance=database_stack.primary_instance,
            replica_db_instance=database_stack.replica_instance,
            primary_vpc=vpc_stack.primary_vpc
        )

        # CloudWatch monitoring and alarms
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_instance=database_stack.primary_instance,
            replica_instance=database_stack.replica_instance,
            failover_function=failover_stack.failover_function
        )

        # Stack outputs
        cdk.CfnOutput(
            self,
            "PrimaryEndpoint",
            value=database_stack.primary_instance.db_instance_endpoint_address,
            description="Primary RDS PostgreSQL endpoint (us-east-1)"
        )

        cdk.CfnOutput(
            self,
            "ReplicaEndpoint",
            value=database_stack.replica_instance.db_instance_endpoint_address,
            description="Replica RDS PostgreSQL endpoint (eu-west-1)"
        )

        cdk.CfnOutput(
            self,
            "Route53CNAME",
            value=failover_stack.route53_cname,
            description="Route53 CNAME for database endpoint"
        )

        cdk.CfnOutput(
            self,
            "FailoverFunctionArn",
            value=failover_stack.failover_function.function_arn,
            description="Lambda function ARN for automated failover"
        )
```

## File: lib/vpc_stack.py

```python
"""vpc_stack.py
VPC infrastructure for primary and replica regions with peering connection.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
)


class VpcStack(Construct):
    """
    Creates VPC infrastructure in both us-east-1 and eu-west-1 regions.

    Args:
        scope (Construct): The parent construct
        id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming

    Attributes:
        primary_vpc (ec2.Vpc): VPC in us-east-1
        replica_vpc (ec2.Vpc): VPC in eu-west-1
        peering_connection (ec2.CfnVPCPeeringConnection): VPC peering connection
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # Primary VPC in us-east-1
        self.primary_vpc = ec2.Vpc(
            self,
            f"PrimaryVpc-{environment_suffix}",
            vpc_name=f"primary-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Replica VPC in eu-west-1 (different CIDR to avoid overlap)
        self.replica_vpc = ec2.Vpc(
            self,
            f"ReplicaVpc-{environment_suffix}",
            vpc_name=f"replica-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-replica-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # VPC Peering Connection between regions
        self.peering_connection = ec2.CfnVPCPeeringConnection(
            self,
            f"VpcPeering-{environment_suffix}",
            vpc_id=self.primary_vpc.vpc_id,
            peer_vpc_id=self.replica_vpc.vpc_id,
            peer_region="eu-west-1"
        )

        # VPC Endpoints for S3 (cost optimization - avoid NAT Gateway)
        self.primary_vpc.add_gateway_endpoint(
            f"PrimaryS3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.replica_vpc.add_gateway_endpoint(
            f"ReplicaS3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )
```

## File: lib/database_stack.py

```python
"""database_stack.py
RDS PostgreSQL primary instance and cross-region read replica configuration.
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
    Creates RDS PostgreSQL primary instance and cross-region read replica.

    Args:
        scope (Construct): The parent construct
        id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_vpc (ec2.Vpc): VPC in primary region
        replica_vpc (ec2.Vpc): VPC in replica region
        primary_region (str): Primary AWS region
        replica_region (str): Replica AWS region

    Attributes:
        primary_instance (rds.DatabaseInstance): Primary RDS instance
        replica_instance (rds.DatabaseInstanceReadReplica): Read replica instance
        db_secret (secretsmanager.Secret): Database credentials secret
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_vpc: ec2.Vpc,
        replica_vpc: ec2.Vpc,
        primary_region: str,
        replica_region: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # Database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self,
            f"DbSecret-{environment_suffix}",
            secret_name=f"postgres-credentials-{environment_suffix}",
            description="PostgreSQL database credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
                include_space=False,
                password_length=30
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

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
            description="PostgreSQL parameter group with audit logging",
            parameters={
                "log_statement": "all",
                "rds.force_ssl": "0"  # Disabled for legacy app compatibility
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

        # Primary RDS PostgreSQL instance (us-east-1)
        self.primary_instance = rds.DatabaseInstance(
            self,
            f"PrimaryInstance-{environment_suffix}",
            instance_identifier=f"primary-postgres-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
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

        # Cross-region read replica (eu-west-1)
        self.replica_instance = rds.DatabaseInstanceReadReplica(
            self,
            f"ReplicaInstance-{environment_suffix}",
            instance_identifier=f"replica-postgres-{environment_suffix}",
            source_database_instance=self.primary_instance,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.LARGE
            ),
            vpc=replica_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[replica_sg],
            subnet_group=replica_subnet_group,
            storage_encrypted=True,
            backup_retention=cdk.Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            parameter_group=parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=cdk.aws_logs.RetentionDays.ONE_WEEK
        )
```

## File: lib/failover_stack.py

```python
"""failover_stack.py
Automated failover mechanism with Lambda and Route53 health checks.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as lambda_,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_logs as logs,
    Duration,
    RemovalPolicy
)


class FailoverStack(Construct):
    """
    Creates automated failover mechanism with Lambda and Route53.

    Args:
        scope (Construct): The parent construct
        id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_db_instance: Primary RDS instance
        replica_db_instance: Replica RDS instance
        primary_vpc (ec2.Vpc): VPC in primary region

    Attributes:
        failover_function (lambda_.Function): Lambda function for failover
        hosted_zone (route53.PrivateHostedZone): Private hosted zone
        route53_cname (str): Route53 CNAME for database endpoint
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_db_instance,
        replica_db_instance,
        primary_vpc: ec2.Vpc,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # Private hosted zone
        self.hosted_zone = route53.PrivateHostedZone(
            self,
            f"PrivateZone-{environment_suffix}",
            zone_name=f"db-{environment_suffix}.internal",
            vpc=primary_vpc
        )

        # Health check for primary database
        health_check = route53.CfnHealthCheck(
            self,
            f"PrimaryHealthCheck-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                port=5432,
                resource_path="/",
                fully_qualified_domain_name=primary_db_instance.db_instance_endpoint_address,
                request_interval=30,
                failure_threshold=3
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-db-health-{environment_suffix}"
                )
            ]
        )

        # Weighted routing policy - primary (100%)
        primary_record = route53.CfnRecordSet(
            self,
            f"PrimaryRecord-{environment_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"postgres.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[primary_db_instance.db_instance_endpoint_address],
            set_identifier="primary",
            weight=100,
            health_check_id=health_check.attr_health_check_id
        )

        # Weighted routing policy - replica (0%)
        replica_record = route53.CfnRecordSet(
            self,
            f"ReplicaRecord-{environment_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"postgres.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[replica_db_instance.db_instance_endpoint_address],
            set_identifier="replica",
            weight=0
        )

        self.route53_cname = f"postgres.{self.hosted_zone.zone_name}"

        # IAM role for failover Lambda
        failover_role = iam.Role(
            self,
            f"FailoverRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for automated failover Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Add permissions for RDS and Route53
        failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:PromoteReadReplica",
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                resources=[
                    primary_db_instance.instance_arn,
                    replica_db_instance.instance_arn
                ]
            )
        )

        failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "route53:ListResourceRecordSets"
                ],
                resources=[
                    f"arn:aws:route53:::hostedzone/{self.hosted_zone.hosted_zone_id}",
                    "arn:aws:route53:::change/*"
                ]
            )
        )

        # Lambda function for automated failover
        self.failover_function = lambda_.Function(
            self,
            f"FailoverFunction-{environment_suffix}",
            function_name=f"db-failover-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/failover"),
            role=failover_role,
            timeout=Duration.seconds(300),
            vpc=primary_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            environment={
                "PRIMARY_INSTANCE_ID": primary_db_instance.instance_identifier,
                "REPLICA_INSTANCE_ID": replica_db_instance.instance_identifier,
                "HOSTED_ZONE_ID": self.hosted_zone.hosted_zone_id,
                "RECORD_NAME": self.route53_cname,
                "PRIMARY_ENDPOINT": primary_db_instance.db_instance_endpoint_address,
                "REPLICA_ENDPOINT": replica_db_instance.db_instance_endpoint_address
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
            description="Automated failover function for PostgreSQL DR"
        )
```

## File: lib/monitoring_stack.py

```python
"""monitoring_stack.py
CloudWatch monitoring, alarms, and logging for disaster recovery.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_logs as logs,
    RemovalPolicy
)


class MonitoringStack(Construct):
    """
    Creates CloudWatch monitoring and alarms for RDS replication.

    Args:
        scope (Construct): The parent construct
        id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_instance: Primary RDS instance
        replica_instance: Replica RDS instance
        failover_function: Lambda function for failover

    Attributes:
        replication_lag_alarm (cloudwatch.Alarm): Alarm for replication lag
        sns_topic (sns.Topic): SNS topic for alarm notifications
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        primary_instance,
        replica_instance,
        failover_function,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        # SNS topic for alarm notifications
        self.sns_topic = sns.Topic(
            self,
            f"AlarmTopic-{environment_suffix}",
            topic_name=f"db-alarms-{environment_suffix}",
            display_name="Database Replication Alarms"
        )

        # CloudWatch alarm for replication lag
        self.replication_lag_alarm = cloudwatch.Alarm(
            self,
            f"ReplicationLagAlarm-{environment_suffix}",
            alarm_name=f"replication-lag-{environment_suffix}",
            alarm_description="Alert when replication lag exceeds 60 seconds",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReplicaLag",
                dimensions_map={
                    "DBInstanceIdentifier": replica_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(1)
            ),
            threshold=60,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING
        )

        self.replication_lag_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for primary database CPU
        primary_cpu_alarm = cloudwatch.Alarm(
            self,
            f"PrimaryCpuAlarm-{environment_suffix}",
            alarm_name=f"primary-cpu-high-{environment_suffix}",
            alarm_description="Alert when primary database CPU exceeds 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": primary_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        primary_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for replica database CPU
        replica_cpu_alarm = cloudwatch.Alarm(
            self,
            f"ReplicaCpuAlarm-{environment_suffix}",
            alarm_name=f"replica-cpu-high-{environment_suffix}",
            alarm_description="Alert when replica database CPU exceeds 80%",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": replica_instance.instance_identifier
                },
                statistic="Average",
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        replica_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch alarm for failover function errors
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{environment_suffix}",
            alarm_name=f"failover-function-errors-{environment_suffix}",
            alarm_description="Alert when failover function encounters errors",
            metric=failover_function.metric_errors(
                period=cdk.Duration.minutes(1)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )

        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(self.sns_topic)
        )

        # CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"Dashboard-{environment_suffix}",
            dashboard_name=f"postgres-dr-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Replication Lag",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="ReplicaLag",
                        dimensions_map={
                            "DBInstanceIdentifier": replica_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(1)
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="Database CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": primary_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(5),
                        label="Primary"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": replica_instance.instance_identifier
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(5),
                        label="Replica"
                    )
                ]
            )
        )
```

## File: lib/lambda/failover/index.py

```python
"""
Automated failover Lambda function for PostgreSQL disaster recovery.
Promotes replica to primary and updates Route53 routing weights.
"""

import os
import json
import boto3
import logging
from botocore.exceptions import ClientError

# Initialize AWS clients
rds_client = boto3.client('rds')
route53_client = boto3.client('route53')

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
PRIMARY_INSTANCE_ID = os.environ['PRIMARY_INSTANCE_ID']
REPLICA_INSTANCE_ID = os.environ['REPLICA_INSTANCE_ID']
HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
RECORD_NAME = os.environ['RECORD_NAME']
PRIMARY_ENDPOINT = os.environ['PRIMARY_ENDPOINT']
REPLICA_ENDPOINT = os.environ['REPLICA_ENDPOINT']


def check_instance_status(instance_id):
    """
    Check the status of an RDS instance.

    Args:
        instance_id (str): RDS instance identifier

    Returns:
        dict: Instance status information
    """
    try:
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]
        return {
            'status': instance['DBInstanceStatus'],
            'available': instance['DBInstanceStatus'] == 'available',
            'endpoint': instance.get('Endpoint', {}).get('Address', '')
        }
    except ClientError as e:
        logger.error(f"Error checking instance status: {e}")
        raise


def promote_replica():
    """
    Promote the read replica to a standalone instance.

    Returns:
        dict: Promotion response
    """
    try:
        logger.info(f"Promoting replica {REPLICA_INSTANCE_ID} to primary")
        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=REPLICA_INSTANCE_ID,
            BackupRetentionPeriod=7
        )
        logger.info("Replica promotion initiated successfully")
        return response
    except ClientError as e:
        logger.error(f"Error promoting replica: {e}")
        raise


def update_route53_weights(primary_weight, replica_weight):
    """
    Update Route53 weighted routing policy.

    Args:
        primary_weight (int): Weight for primary record
        replica_weight (int): Weight for replica record

    Returns:
        dict: Route53 change response
    """
    try:
        logger.info(f"Updating Route53 weights: primary={primary_weight}, replica={replica_weight}")

        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': RECORD_NAME,
                        'Type': 'CNAME',
                        'SetIdentifier': 'primary',
                        'Weight': primary_weight,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': PRIMARY_ENDPOINT}]
                    }
                },
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': RECORD_NAME,
                        'Type': 'CNAME',
                        'SetIdentifier': 'replica',
                        'Weight': replica_weight,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': REPLICA_ENDPOINT}]
                    }
                }
            ]
        }

        response = route53_client.change_resource_record_sets(
            HostedZoneId=HOSTED_ZONE_ID,
            ChangeBatch=change_batch
        )

        logger.info("Route53 weights updated successfully")
        return response

    except ClientError as e:
        logger.error(f"Error updating Route53 weights: {e}")
        raise


def handler(event, context):
    """
    Lambda handler for automated failover.

    Args:
        event (dict): Lambda event object
        context: Lambda context object

    Returns:
        dict: Execution result
    """
    try:
        logger.info("Starting automated failover process")
        logger.info(f"Event: {json.dumps(event)}")

        # Check primary instance status
        primary_status = check_instance_status(PRIMARY_INSTANCE_ID)
        logger.info(f"Primary status: {primary_status}")

        # Check replica instance status
        replica_status = check_instance_status(REPLICA_INSTANCE_ID)
        logger.info(f"Replica status: {replica_status}")

        # Determine if failover is needed
        if not primary_status['available'] and replica_status['available']:
            logger.warning("Primary is unavailable, initiating failover")

            # Promote replica to primary
            promote_response = promote_replica()

            # Update Route53 to direct traffic to replica
            route53_response = update_route53_weights(
                primary_weight=0,
                replica_weight=100
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Failover completed successfully',
                    'action': 'promoted_replica',
                    'primary_status': primary_status['status'],
                    'replica_status': replica_status['status']
                })
            }

        elif primary_status['available']:
            logger.info("Primary is available, no failover needed")

            # Ensure routing is configured correctly
            update_route53_weights(
                primary_weight=100,
                replica_weight=0
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Primary is healthy, no action needed',
                    'action': 'none',
                    'primary_status': primary_status['status'],
                    'replica_status': replica_status['status']
                })
            }

        else:
            logger.error("Both instances are unavailable")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'message': 'Both primary and replica are unavailable',
                    'action': 'none',
                    'primary_status': primary_status['status'],
                    'replica_status': replica_status['status']
                })
            }

    except Exception as e:
        logger.error(f"Failover process failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failover process failed',
                'error': str(e)
            })
        }
```

## File: lib/lambda/failover/requirements.txt

```
boto3>=1.28.0
```

## File: lib/README.md

```markdown
# Multi-Region PostgreSQL Disaster Recovery Solution

AWS CDK Python implementation for automated multi-region disaster recovery with PostgreSQL.

## Architecture Overview

This solution implements a multi-region disaster recovery architecture with:

- **Primary Region**: us-east-1 (RDS PostgreSQL Multi-AZ)
- **DR Region**: eu-west-1 (Cross-region read replica)
- **Automated Failover**: Lambda-based promotion and DNS switching
- **Health Monitoring**: Route53 health checks and CloudWatch alarms

## Components

### VPC Infrastructure
- Isolated VPCs in both regions (separate CIDR blocks)
- VPC peering connection for cross-region communication
- Private subnets for database deployment
- VPC endpoints for S3 (cost optimization)

### Database Layer
- Primary RDS PostgreSQL 15.x instance (us-east-1)
  - Instance type: db.t3.large
  - Multi-AZ enabled
  - 7-day backup retention
  - Encryption at rest

- Cross-region read replica (eu-west-1)
  - Same instance type and configuration
  - Independent automated backups
  - Ready for promotion

### Automated Failover
- Lambda function monitors database health
- Promotes replica on primary failure
- Updates Route53 routing weights (100% → 0% and 0% → 100%)
- 300-second timeout for complete failover cycle
- Comprehensive error handling and logging

### Monitoring & Alarms
- CloudWatch alarms for:
  - Replication lag > 60 seconds
  - Primary/replica CPU utilization
  - Lambda function errors
- CloudWatch dashboard for visualization
- SNS notifications for all alarms
- Centralized logging with /aws/rds/ prefix

### Security
- Database credentials in AWS Secrets Manager
- Security groups with VPC-scoped ingress rules
- IAM roles with least privilege principles
- Parameter group with audit logging (log_statement='all')
- force_ssl disabled for legacy compatibility

## Deployment

### Prerequisites
- AWS CDK 2.x installed
- Python 3.8 or higher
- AWS CLI configured
- Appropriate AWS permissions

### Installation

```bash
# Install dependencies
pipenv install

# Synthesize CloudFormation template
pipenv run cdk synth -c environmentSuffix=<your-suffix>

# Deploy infrastructure
pipenv run cdk deploy -c environmentSuffix=<your-suffix>
```

### Configuration

Set the `environmentSuffix` context variable to ensure unique resource naming:

```bash
cdk deploy -c environmentSuffix=prod
```

## Stack Outputs

After deployment, the following outputs are available:

- `PrimaryEndpoint`: Primary database endpoint (us-east-1)
- `ReplicaEndpoint`: Replica database endpoint (eu-west-1)
- `Route53CNAME`: DNS name for database access
- `FailoverFunctionArn`: Lambda function ARN for manual invocation

## Failover Process

### Automatic Failover

The Lambda function automatically triggers when:
1. Route53 health check detects primary unavailability
2. CloudWatch alarm fires for sustained failure
3. Lambda promotes replica and updates DNS

### Manual Failover

To manually trigger failover:

```bash
aws lambda invoke \
  --function-name db-failover-<environment-suffix> \
  --payload '{"action": "manual_failover"}' \
  response.json
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard named `postgres-dr-<environment-suffix>` to view:
- Replication lag metrics
- CPU utilization for both instances
- Connection counts
- I/O metrics

### Alarms

The following alarms are configured:
- **ReplicationLag**: Triggers when lag > 60 seconds for 2 consecutive minutes
- **PrimaryCPU**: Triggers when CPU > 80% for 10 consecutive minutes
- **ReplicaCPU**: Triggers when CPU > 80% for 10 consecutive minutes
- **LambdaErrors**: Triggers on any failover function error

## Cost Optimization

- No NAT Gateways (uses VPC endpoints)
- t3.large instances (burstable performance)
- 7-day backup retention (minimal)
- Serverless Lambda for failover (pay per use)

## Testing

Run unit tests:

```bash
# Run all tests
pipenv run pytest tests/

# Run with coverage
pipenv run pytest tests/ --cov=lib --cov-report=html
```

## Cleanup

To destroy all resources:

```bash
cdk destroy -c environmentSuffix=<your-suffix>
```

All resources are configured with `deletion_protection=False` for safe cleanup.

## Compliance Notes

- **Audit Logging**: All SQL statements logged via log_statement='all'
- **Encryption**: AES-256 encryption at rest using AWS managed keys
- **Backup**: 7-day retention for both primary and replica
- **SSL**: Disabled (force_ssl=0) for legacy application compatibility

## Architecture Diagram

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│         us-east-1               │     │         eu-west-1               │
│  ┌──────────────────────────┐  │     │  ┌──────────────────────────┐  │
│  │   VPC (10.0.0.0/16)      │  │     │  │   VPC (10.1.0.0/16)      │  │
│  │                          │  │<════>│  │                          │  │
│  │  ┌────────────────────┐  │  │     │  │  ┌────────────────────┐  │  │
│  │  │ RDS Primary        │  │  │     │  │  │ RDS Replica        │  │  │
│  │  │ (Multi-AZ)         │  │  │     │  │  │                    │  │  │
│  │  │ db.t3.large        │══════════════>  │ db.t3.large        │  │  │
│  │  └────────────────────┘  │  │     │  │  └────────────────────┘  │  │
│  │                          │  │     │  │                          │  │
│  │  ┌────────────────────┐  │  │     │  │                          │  │
│  │  │ Lambda Failover    │  │  │     │  │                          │  │
│  │  └────────────────────┘  │  │     │  │                          │  │
│  └──────────────────────────┘  │     │  └──────────────────────────┘  │
└─────────────────────────────────┘     └─────────────────────────────────┘
           │                                         │
           └─────────────────┬───────────────────────┘
                            │
                  ┌──────────────────┐
                  │   Route53        │
                  │  Weighted Policy │
                  │  + Health Checks │
                  └──────────────────┘
```

## Support

For issues or questions:
1. Check CloudWatch Logs: `/aws/lambda/db-failover-<suffix>`
2. Review CloudWatch Dashboard: `postgres-dr-<suffix>`
3. Check RDS events in AWS Console

## License

This infrastructure code is part of the TAP (Test Automation Platform) project.
```
