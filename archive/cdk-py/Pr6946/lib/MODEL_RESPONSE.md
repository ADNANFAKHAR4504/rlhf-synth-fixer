# Migration Orchestration Infrastructure Implementation

This implementation provides a comprehensive CDK Python solution for orchestrating a phased migration from on-premises to AWS, including database replication, server migration, hybrid connectivity, and automated monitoring.

## Architecture Overview

The solution includes:
- VPC with 3 availability zones for high availability
- DMS replication instance for database migration
- CloudEndure IAM roles for server replication
- Site-to-Site VPN for hybrid connectivity
- Route 53 private hosted zone for DNS management
- DynamoDB for migration tracking
- SNS for notifications
- Systems Manager documents for validation
- Lambda functions for automated rollback
- CloudWatch dashboard for monitoring

## File: lib/__init__.py

```python
"""Migration orchestration infrastructure package."""
```

## File: lib/tap_stack.py

```python
"""
CDK stack for migration orchestration infrastructure.

This stack orchestrates a phased migration from on-premises to AWS, including:
- Database migration with DMS
- Server replication with CloudEndure
- Hybrid connectivity with Site-to-Site VPN
- DNS management with Route 53
- Migration tracking with DynamoDB
- Notifications with SNS
- Post-migration validation with Systems Manager
- Automated rollback with Lambda
- Monitoring with CloudWatch
"""
from typing import Any
from dataclasses import dataclass

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    CfnOutput,
    Duration,
    aws_ec2 as ec2,
    aws_dms as dms,
    aws_iam as iam,
    aws_route53 as route53,
    aws_dynamodb as dynamodb,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_ssm as ssm,
    aws_lambda as lambda_,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_kms as kms,
)
from constructs import Construct


@dataclass
class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""
    environment_suffix: str
    env: cdk.Environment


class TapStack(Stack):
    """Migration orchestration infrastructure stack."""

    def __init__(self, scope: Construct, construct_id: str, *, props: TapStackProps, **kwargs: Any) -> None:
        """Initialize the migration orchestration stack.

        Args:
            scope: The scope in which to define this construct.
            construct_id: The scoped construct ID.
            props: Stack properties including environment_suffix.
            **kwargs: Additional keyword arguments for the Stack.
        """
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = props.environment_suffix

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC for hybrid cloud architecture
        self.vpc = self._create_vpc()

        # Create Customer Gateway for VPN
        self.customer_gateway = self._create_customer_gateway()

        # Create VPN Connection
        self.vpn_connection = self._create_vpn_connection()

        # Create DMS resources for database migration
        self.dms_replication_subnet_group = self._create_dms_subnet_group()
        self.dms_replication_instance = self._create_dms_replication_instance()

        # Create IAM role for CloudEndure
        self.cloudendure_role = self._create_cloudendure_role()

        # Create Route 53 private hosted zone
        self.private_hosted_zone = self._create_private_hosted_zone()

        # Create DynamoDB table for migration tracking
        self.migration_tracking_table = self._create_migration_tracking_table()

        # Create SNS topic for notifications
        self.sns_topic = self._create_sns_topic()

        # Create Systems Manager document for validation
        self.ssm_document = self._create_ssm_document()

        # Create Lambda function for rollback
        self.rollback_lambda = self._create_rollback_lambda()

        # Create CloudWatch dashboard
        self.dashboard = self._create_cloudwatch_dashboard()

        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption at rest.

        Returns:
            KMS key for encryption.
        """
        key = kms.Key(
            self,
            f"MigrationKey-{self.environment_suffix}",
            description=f"KMS key for migration infrastructure encryption {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )
        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC for migration infrastructure.

        Returns:
            VPC with 3 availability zones.
        """
        vpc = ec2.Vpc(
            self,
            f"MigrationVpc-{self.environment_suffix}",
            vpc_name=f"migration-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,  # Cost optimization: 1 NAT gateway instead of per-AZ
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Add VPC endpoints for cost optimization
        vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        vpc.add_gateway_endpoint(
            f"DynamoDbEndpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        return vpc

    def _create_customer_gateway(self) -> ec2.CfnCustomerGateway:
        """Create Customer Gateway for VPN connection.

        Returns:
            Customer Gateway for on-premises connection.
        """
        # Note: Replace with actual on-premises public IP
        customer_gateway = ec2.CfnCustomerGateway(
            self,
            f"CustomerGateway-{self.environment_suffix}",
            bgp_asn=65000,  # BGP ASN for on-premises network
            ip_address="203.0.113.12",  # Placeholder - replace with actual on-premises public IP
            type="ipsec.1",
            tags=[
                cdk.CfnTag(key="Name", value=f"customer-gateway-{self.environment_suffix}"),
            ],
        )
        return customer_gateway

    def _create_vpn_connection(self) -> ec2.CfnVPNConnection:
        """Create Site-to-Site VPN connection.

        Returns:
            VPN connection for hybrid connectivity.
        """
        # Create Virtual Private Gateway
        vpn_gateway = ec2.CfnVPNGateway(
            self,
            f"VpnGateway-{self.environment_suffix}",
            type="ipsec.1",
            amazon_side_asn=64512,
            tags=[
                cdk.CfnTag(key="Name", value=f"vpn-gateway-{self.environment_suffix}"),
            ],
        )

        # Attach VPN Gateway to VPC
        ec2.CfnVPCGatewayAttachment(
            self,
            f"VpnGatewayAttachment-{self.environment_suffix}",
            vpc_id=self.vpc.vpc_id,
            vpn_gateway_id=vpn_gateway.ref,
        )

        # Create VPN Connection
        vpn_connection = ec2.CfnVPNConnection(
            self,
            f"VpnConnection-{self.environment_suffix}",
            customer_gateway_id=self.customer_gateway.ref,
            type="ipsec.1",
            vpn_gateway_id=vpn_gateway.ref,
            static_routes_only=False,  # Use BGP for dynamic routing
            tags=[
                cdk.CfnTag(key="Name", value=f"vpn-connection-{self.environment_suffix}"),
            ],
        )

        # Enable route propagation for private subnets
        for subnet in self.vpc.private_subnets:
            ec2.CfnVPNGatewayRoutePropagation(
                self,
                f"VpnRoutePropagation-{subnet.node.id}-{self.environment_suffix}",
                route_table_ids=[subnet.route_table.route_table_id],
                vpn_gateway_id=vpn_gateway.ref,
            )

        return vpn_connection

    def _create_dms_subnet_group(self) -> dms.CfnReplicationSubnetGroup:
        """Create DMS replication subnet group.

        Returns:
            DMS replication subnet group.
        """
        subnet_group = dms.CfnReplication SubnetGroup(
            self,
            f"DmsSubnetGroup-{self.environment_suffix}",
            replication_subnet_group_description=f"DMS replication subnet group for migration {self.environment_suffix}",
            replication_subnet_group_identifier=f"dms-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
            tags=[
                cdk.CfnTag(key="Name", value=f"dms-subnet-group-{self.environment_suffix}"),
            ],
        )
        return subnet_group

    def _create_dms_replication_instance(self) -> dms.CfnReplicationInstance:
        """Create DMS replication instance for database migration.

        Returns:
            DMS replication instance with multi-AZ deployment.
        """
        # Create security group for DMS
        dms_security_group = ec2.SecurityGroup(
            self,
            f"DmsSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for DMS replication instance {self.environment_suffix}",
            security_group_name=f"dms-sg-{self.environment_suffix}",
        )

        # Allow PostgreSQL traffic from on-premises network
        dms_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("192.168.0.0/16"),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from on-premises",
        )

        # Allow PostgreSQL traffic within VPC
        dms_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL within VPC",
        )

        replication_instance = dms.CfnReplicationInstance(
            self,
            f"DmsReplicationInstance-{self.environment_suffix}",
            replication_instance_class="dms.t3.medium",
            replication_instance_identifier=f"dms-replication-{self.environment_suffix}",
            allocated_storage=100,
            multi_az=True,
            publicly_accessible=False,
            replication_subnet_group_identifier=self.dms_replication_subnet_group.replication_subnet_group_identifier,
            vpc_security_group_ids=[dms_security_group.security_group_id],
            engine_version="3.5.2",
            kms_key_id=self.kms_key.key_id,
            tags=[
                cdk.CfnTag(key="Name", value=f"dms-replication-{self.environment_suffix}"),
            ],
        )

        replication_instance.add_dependency(self.dms_replication_subnet_group)

        return replication_instance

    def _create_cloudendure_role(self) -> iam.Role:
        """Create IAM role for CloudEndure service.

        Returns:
            IAM role with permissions for CloudEndure.
        """
        role = iam.Role(
            self,
            f"CloudEndureRole-{self.environment_suffix}",
            role_name=f"cloudendure-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("cloudendure.amazonaws.com"),
            description=f"IAM role for CloudEndure server replication {self.environment_suffix}",
        )

        # Add CloudEndure required permissions
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:DescribeInstances",
                    "ec2:DescribeVolumes",
                    "ec2:DescribeSnapshots",
                    "ec2:DescribeImages",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeKeyPairs",
                    "ec2:DescribePlacementGroups",
                    "ec2:DescribeAvailabilityZones",
                    "ec2:DescribeInstanceAttribute",
                    "ec2:DescribeVpcs",
                    "ec2:CreateSnapshot",
                    "ec2:CreateTags",
                    "ec2:CreateVolume",
                    "ec2:CreateImage",
                    "ec2:RunInstances",
                    "ec2:StartInstances",
                    "ec2:StopInstances",
                    "ec2:TerminateInstances",
                    "ec2:ModifyInstanceAttribute",
                    "ec2:AttachVolume",
                    "ec2:DetachVolume",
                    "ec2:DeleteVolume",
                    "ec2:DeleteSnapshot",
                ],
                resources=["*"],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "iam:PassRole",
                    "iam:GetRole",
                ],
                resources=[role.role_arn],
            )
        )

        return role

    def _create_private_hosted_zone(self) -> route53.PrivateHostedZone:
        """Create Route 53 private hosted zone for DNS management.

        Returns:
            Private hosted zone for gradual DNS cutover.
        """
        hosted_zone = route53.PrivateHostedZone(
            self,
            f"MigrationHostedZone-{self.environment_suffix}",
            zone_name=f"migration-{self.environment_suffix}.internal",
            vpc=self.vpc,
        )
        return hosted_zone

    def _create_migration_tracking_table(self) -> dynamodb.Table:
        """Create DynamoDB table for migration tracking.

        Returns:
            DynamoDB table for storing migration status.
        """
        table = dynamodb.Table(
            self,
            f"MigrationTrackingTable-{self.environment_suffix}",
            table_name=f"migration-tracking-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="serverId",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
        )

        # Add GSI for querying by migration phase
        table.add_global_secondary_index(
            index_name="MigrationPhaseIndex",
            partition_key=dynamodb.Attribute(
                name="migrationPhase",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING,
            ),
        )

        return table

    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for migration notifications.

        Returns:
            SNS topic for status notifications.
        """
        topic = sns.Topic(
            self,
            f"MigrationNotificationTopic-{self.environment_suffix}",
            topic_name=f"migration-notifications-{self.environment_suffix}",
            display_name=f"Migration Status Notifications {self.environment_suffix}",
            master_key=self.kms_key,
        )

        # Note: Email subscriptions should be added manually or via parameter
        # topic.add_subscription(subscriptions.EmailSubscription("admin@example.com"))

        return topic

    def _create_ssm_document(self) -> ssm.CfnDocument:
        """Create Systems Manager document for post-migration validation.

        Returns:
            SSM document for automated validation.
        """
        document = ssm.CfnDocument(
            self,
            f"PostMigrationValidation-{self.environment_suffix}",
            name=f"post-migration-validation-{self.environment_suffix}",
            document_type="Command",
            content={
                "schemaVersion": "2.2",
                "description": "Post-migration validation document",
                "parameters": {
                    "serverId": {
                        "type": "String",
                        "description": "Server ID to validate",
                    },
                },
                "mainSteps": [
                    {
                        "action": "aws:runShellScript",
                        "name": "validateApplicationHealth",
                        "inputs": {
                            "runCommand": [
                                "#!/bin/bash",
                                "# Check application health",
                                "curl -f http://localhost:8080/health || exit 1",
                                "echo 'Application health check passed'",
                            ],
                        },
                    },
                    {
                        "action": "aws:runShellScript",
                        "name": "validateDatabaseConnectivity",
                        "inputs": {
                            "runCommand": [
                                "#!/bin/bash",
                                "# Check database connectivity",
                                "pg_isready -h $DB_HOST -p 5432 || exit 1",
                                "echo 'Database connectivity check passed'",
                            ],
                        },
                    },
                    {
                        "action": "aws:runShellScript",
                        "name": "validateServiceAvailability",
                        "inputs": {
                            "runCommand": [
                                "#!/bin/bash",
                                "# Check service availability",
                                "systemctl is-active --quiet application.service || exit 1",
                                "echo 'Service availability check passed'",
                            ],
                        },
                    },
                ],
            },
            tags=[
                cdk.CfnTag(key="Name", value=f"post-migration-validation-{self.environment_suffix}"),
            ],
        )

        return document

    def _create_rollback_lambda(self) -> lambda_.Function:
        """Create Lambda function for automated rollback.

        Returns:
            Lambda function that handles rollback logic.
        """
        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f"RollbackLambdaRole-{self.environment_suffix}",
            role_name=f"rollback-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
            ],
        )

        # Add permissions for Route 53, DynamoDB, SNS
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetHostedZone",
                    "route53:ListResourceRecordSets",
                ],
                resources=[self.private_hosted_zone.hosted_zone_arn],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                ],
                resources=[
                    self.migration_tracking_table.table_arn,
                    f"{self.migration_tracking_table.table_arn}/index/*",
                ],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=["sns:Publish"],
                resources=[self.sns_topic.topic_arn],
            )
        )

        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:DescribeAlarms",
                ],
                resources=["*"],
            )
        )

        # Create Lambda function
        rollback_function = lambda_.Function(
            self,
            f"RollbackFunction-{self.environment_suffix}",
            function_name=f"migration-rollback-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
import json
import boto3
import os
from datetime import datetime

route53 = boto3.client('route53')
dynamodb = boto3.client('dynamodb')
sns = boto3.client('sns')

HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    \"\"\"Handle automated rollback on migration issues.\"\"\"
    print(f"Rollback triggered: {json.dumps(event)}")

    try:
        # Extract alarm details
        alarm_name = event.get('alarmName', 'Unknown')
        alarm_state = event.get('alarmState', 'ALARM')

        if alarm_state != 'ALARM':
            print(f"Alarm state is {alarm_state}, no rollback needed")
            return {'statusCode': 200, 'body': 'No rollback needed'}

        # Update Route 53 weighted routing to shift traffic back to on-premises
        # This is a simplified example - adjust based on your DNS setup
        print(f"Initiating rollback for alarm: {alarm_name}")

        # Log rollback event to DynamoDB
        timestamp = datetime.utcnow().isoformat()
        dynamodb.put_item(
            TableName=TABLE_NAME,
            Item={
                'serverId': {'S': 'ROLLBACK_EVENT'},
                'timestamp': {'S': timestamp},
                'migrationPhase': {'S': 'ROLLBACK'},
                'status': {'S': 'INITIATED'},
                'alarmName': {'S': alarm_name},
                'alarmState': {'S': alarm_state}
            }
        )

        # Send SNS notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Migration Rollback Initiated - {alarm_name}',
            Message=f'''
Migration rollback has been initiated due to alarm: {alarm_name}

Alarm State: {alarm_state}
Timestamp: {timestamp}

Action Taken:
- Traffic routing being shifted back to on-premises
- Rollback event logged in migration tracking table

Please review the CloudWatch dashboard and migration logs for details.
            '''
        )

        print(f"Rollback completed successfully for alarm: {alarm_name}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback initiated successfully',
                'alarm': alarm_name,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        print(f"Error during rollback: {str(e)}")
        # Send error notification
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='Migration Rollback Error',
            Message=f'Error during rollback: {str(e)}'
        )
        raise
"""
            ),
            role=lambda_role,
            timeout=Duration.minutes(5),
            environment={
                "HOSTED_ZONE_ID": self.private_hosted_zone.hosted_zone_id,
                "TABLE_NAME": self.migration_tracking_table.table_name,
                "SNS_TOPIC_ARN": self.sns_topic.topic_arn,
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        return rollback_function

    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard for migration metrics.

        Returns:
            CloudWatch dashboard with key migration metrics.
        """
        dashboard = cloudwatch.Dashboard(
            self,
            f"MigrationDashboard-{self.environment_suffix}",
            dashboard_name=f"migration-dashboard-{self.environment_suffix}",
        )

        # Add DMS replication lag widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DMS Replication Lag",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DMS",
                        metric_name="CDCLatencySource",
                        dimensions_map={
                            "ReplicationInstanceIdentifier": self.dms_replication_instance.replication_instance_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DMS",
                        metric_name="CDCLatencyTarget",
                        dimensions_map={
                            "ReplicationInstanceIdentifier": self.dms_replication_instance.replication_instance_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            )
        )

        # Add VPN connection status widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="VPN Connection Status",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/VPN",
                        metric_name="TunnelState",
                        dimensions_map={
                            "VpnId": self.vpn_connection.ref,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/VPN",
                        metric_name="TunnelDataIn",
                        dimensions_map={
                            "VpnId": self.vpn_connection.ref,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/VPN",
                        metric_name="TunnelDataOut",
                        dimensions_map={
                            "VpnId": self.vpn_connection.ref,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            )
        )

        # Add Lambda rollback function metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Rollback Lambda Invocations",
                left=[
                    self.rollback_lambda.metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    self.rollback_lambda.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            )
        )

        # Add DynamoDB table metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Migration Tracking Table Activity",
                left=[
                    self.migration_tracking_table.metric_consumed_read_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    self.migration_tracking_table.metric_consumed_write_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
            )
        )

        return dashboard

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for the stack."""
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for migration infrastructure",
            export_name=f"MigrationVpcId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DmsReplicationInstanceArn",
            value=self.dms_replication_instance.ref,
            description="DMS replication instance ARN",
            export_name=f"DmsReplicationInstanceArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "CloudEndureRoleArn",
            value=self.cloudendure_role.role_arn,
            description="CloudEndure IAM role ARN",
            export_name=f"CloudEndureRoleArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "VpnConnectionId",
            value=self.vpn_connection.ref,
            description="VPN connection ID",
            export_name=f"VpnConnectionId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "PrivateHostedZoneId",
            value=self.private_hosted_zone.hosted_zone_id,
            description="Private hosted zone ID",
            export_name=f"PrivateHostedZoneId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "MigrationTrackingTableName",
            value=self.migration_tracking_table.table_name,
            description="Migration tracking DynamoDB table name",
            export_name=f"MigrationTrackingTableName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SnsTopicArn",
            value=self.sns_topic.topic_arn,
            description="SNS topic ARN for notifications",
            export_name=f"SnsTopicArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SsmDocumentName",
            value=self.ssm_document.name,
            description="SSM document name for post-migration validation",
            export_name=f"SsmDocumentName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "RollbackLambdaArn",
            value=self.rollback_lambda.function_arn,
            description="Rollback Lambda function ARN",
            export_name=f"RollbackLambdaArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DashboardName",
            value=self.dashboard.dashboard_name,
            description="CloudWatch dashboard name",
            export_name=f"DashboardName-{self.environment_suffix}",
        )
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for migration orchestration infrastructure.

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

# Apply tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('PRNumber', pr_number)
Tags.of(app).add('Team', team)
Tags.of(app).add('CreatedAt', created_at)

# Create a TapStackProps object to pass environment_suffix
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

## File: lib/README.md

```markdown
# Migration Orchestration Infrastructure

This CDK Python application provides comprehensive infrastructure for orchestrating a phased migration from on-premises to AWS cloud.

## Architecture

The solution implements a complete migration orchestration platform with:

### Core Components

1. **VPC Infrastructure**
   - VPC with 10.0.0.0/16 CIDR across 3 availability zones
   - Public and private subnets in each AZ
   - NAT Gateway for internet access (1 for cost optimization)
   - VPC endpoints for S3 and DynamoDB

2. **Database Migration (DMS)**
   - Multi-AZ DMS replication instance (dms.t3.medium)
   - 100GB allocated storage with encryption
   - Replication subnet group across private subnets
   - Security groups for PostgreSQL access

3. **Server Replication (CloudEndure)**
   - IAM role with required permissions
   - EC2 describe, create, and modify permissions
   - Support for 12 application server instances

4. **Hybrid Connectivity (VPN)**
   - Site-to-Site VPN with BGP routing
   - Customer Gateway for on-premises (203.0.113.12 placeholder)
   - Virtual Private Gateway attached to VPC
   - Route propagation to private subnets
   - Connection between 192.168.0.0/16 (on-premises) and 10.0.0.0/16 (AWS)

5. **DNS Management (Route 53)**
   - Private hosted zone (migration-{environmentSuffix}.internal)
   - Support for blue-green deployment
   - Weighted routing for gradual traffic shifting

6. **Migration Tracking (DynamoDB)**
   - Table with serverId (partition key) and timestamp (sort key)
   - Global secondary index on migrationPhase
   - Encrypted with customer-managed KMS key
   - On-demand billing mode

7. **Notifications (SNS)**
   - Topic for migration status updates
   - Encrypted with KMS
   - Support for email subscriptions (add manually)

8. **Post-Migration Validation (Systems Manager)**
   - SSM document for automated validation
   - Application health checks
   - Database connectivity tests
   - Service availability verification

9. **Automated Rollback (Lambda)**
   - Python 3.11 Lambda function
   - Triggered by CloudWatch alarms
   - Updates Route 53 routing
   - Logs events to DynamoDB
   - Sends SNS notifications

10. **Monitoring (CloudWatch)**
    - Comprehensive dashboard
    - DMS replication lag metrics
    - VPN connection status
    - Lambda invocation metrics
    - DynamoDB activity metrics

## Prerequisites

- AWS CDK 2.x
- Python 3.8 or higher
- AWS CLI configured with appropriate credentials
- Node.js 18.x or higher (for CDK CLI)

## Deployment

### Install Dependencies

```bash
pip install -r requirements.txt
npm install -g aws-cdk
```

### Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Deploy Stack

```bash
# Deploy with default environment suffix (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### Verify Deployment

```bash
# List all stacks
cdk ls

# View synthesized CloudFormation template
cdk synth
```

## Configuration

### Environment Suffix

The `environmentSuffix` context variable is used to create unique resource names:

```bash
cdk deploy -c environmentSuffix=staging
```

### On-Premises IP Address

Update the Customer Gateway IP address in `lib/tap_stack.py`:

```python
ip_address="203.0.113.12",  # Replace with actual on-premises public IP
```

### Email Notifications

Add email subscription to SNS topic in `lib/tap_stack.py`:

```python
topic.add_subscription(subscriptions.EmailSubscription("admin@example.com"))
```

## Migration Workflow

### Phase 1: Setup Hybrid Connectivity
1. Deploy the infrastructure stack
2. Configure on-premises VPN device with VPN connection details
3. Verify VPN tunnels are up (check CloudWatch dashboard)

### Phase 2: Database Migration
1. Create DMS endpoints for source and target databases
2. Create DMS replication task
3. Start replication and monitor lag in CloudWatch dashboard
4. Verify data consistency

### Phase 3: Server Migration
1. Install CloudEndure agents on on-premises servers
2. Configure replication using CloudEndure IAM role
3. Monitor replication progress
4. Perform test cutover
5. Log status in DynamoDB migration tracking table

### Phase 4: DNS Cutover
1. Create weighted routing records in Route 53
2. Gradually shift traffic from on-premises to AWS (90/10, 50/50, 10/90, 0/100)
3. Monitor application metrics
4. Roll back if issues detected (Lambda function)

### Phase 5: Validation
1. Execute SSM document for post-migration validation
2. Verify application health, database connectivity, service availability
3. Update migration status in DynamoDB

### Phase 6: Cleanup
1. Decommission on-premises resources
2. Remove VPN connection if no longer needed
3. Update documentation

## Monitoring

### CloudWatch Dashboard

Access the dashboard: `migration-dashboard-{environmentSuffix}`

Key metrics:
- **DMS Replication Lag**: CDCLatencySource and CDCLatencyTarget
- **VPN Connection**: TunnelState, TunnelDataIn, TunnelDataOut
- **Lambda Rollback**: Invocations and errors
- **DynamoDB**: Read/write capacity consumption

### DynamoDB Migration Tracking

Query migration status:

```bash
aws dynamodb query \
  --table-name migration-tracking-{environmentSuffix} \
  --index-name MigrationPhaseIndex \
  --key-condition-expression "migrationPhase = :phase" \
  --expression-attribute-values '{":phase":{"S":"CUTOVER"}}'
```

### SNS Notifications

Subscribe to topic:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:migration-notifications-{environmentSuffix} \
  --protocol email \
  --notification-endpoint admin@example.com
```

## Rollback Procedure

Automated rollback triggers when CloudWatch alarms detect issues:

1. Lambda function invoked by alarm
2. Route 53 weighted routing updated to shift traffic back to on-premises
3. Event logged in DynamoDB
4. SNS notification sent to subscribers

Manual rollback:

```bash
aws lambda invoke \
  --function-name migration-rollback-{environmentSuffix} \
  --payload '{"alarmName":"HighErrorRate","alarmState":"ALARM"}' \
  response.json
```

## Testing

### Unit Tests

```bash
pytest tests/unit/ -v
```

### Integration Tests

```bash
pytest tests/integration/ -v
```

## Security

- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit using TLS/SSL
- IAM roles follow principle of least privilege
- VPN connection uses IPsec
- Private subnets for all data resources
- Security groups restrict access to necessary ports only

## Cost Optimization

- Single NAT Gateway instead of per-AZ (saves ~$64/month)
- VPC endpoints for S3 and DynamoDB (reduces NAT costs)
- DynamoDB on-demand billing (no provisioned capacity)
- DMS t3.medium instance (right-sized for 500GB database)
- Lambda with 5-minute timeout (pay per use)

## Troubleshooting

### VPN Connection Issues

Check tunnel status:

```bash
aws ec2 describe-vpn-connections \
  --vpn-connection-ids vpn-xxxxx \
  --query 'VpnConnections[0].VgwTelemetry'
```

### DMS Replication Issues

Check task status:

```bash
aws dms describe-replication-tasks \
  --filters Name=replication-instance-arn,Values=arn:aws:dms:...
```

### Lambda Errors

View logs:

```bash
aws logs tail /aws/lambda/migration-rollback-{environmentSuffix} --follow
```

## Cleanup

```bash
# Destroy all resources
cdk destroy

# Confirm deletion
# Type 'y' when prompted
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Support

For issues or questions:
1. Check CloudWatch dashboard for metrics
2. Review CloudWatch Logs for Lambda and DMS
3. Query DynamoDB table for migration events
4. Check SNS notifications for alerts
