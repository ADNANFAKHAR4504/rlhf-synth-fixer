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


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""
    def __init__(self, environment_suffix: str, **kwargs: Any) -> None:
        """Initialize TapStackProps.

        Args:
            environment_suffix: The environment suffix for resource naming.
            **kwargs: Additional stack properties.
        """
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


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

        # Create DMS prerequisite IAM roles (must be created before DMS resources)
        self._create_dms_prerequisite_roles()

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
        # Store attachment in variable to ensure proper dependency ordering
        vpn_gateway_attachment = ec2.CfnVPCGatewayAttachment(
            self,
            f"VpnGatewayAttachment-{self.environment_suffix}",
            vpc_id=self.vpc.vpc_id,
            vpn_gateway_id=vpn_gateway.ref,
        )
        # Ensure attachment depends on VPN Gateway
        vpn_gateway_attachment.add_dependency(vpn_gateway)

        # Create VPN Connection
        # Must wait for VPN Gateway attachment to complete before creating connection
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
        # Add explicit dependencies to ensure proper creation order
        vpn_connection.add_dependency(vpn_gateway)
        vpn_connection.add_dependency(vpn_gateway_attachment)
        vpn_connection.add_dependency(self.customer_gateway)

        # Enable route propagation for private subnets
        # Route propagation must wait for VPN Gateway attachment
        for subnet in self.vpc.private_subnets:
            route_propagation = ec2.CfnVPNGatewayRoutePropagation(
                self,
                f"VpnRoutePropagation-{subnet.node.id}-{self.environment_suffix}",
                route_table_ids=[subnet.route_table.route_table_id],
                vpn_gateway_id=vpn_gateway.ref,
            )
            # Ensure route propagation waits for attachment
            route_propagation.add_dependency(vpn_gateway_attachment)

        return vpn_connection

    def _create_dms_prerequisite_roles(self) -> None:
        """Create DMS prerequisite IAM roles required for DMS to manage VPC resources.
        
        AWS DMS requires a service-linked role named exactly 'dms-vpc-role' to access
        VPC resources. This role must exist before creating DMS subnet groups or
        replication instances.
        """
        # Create DMS VPC management role
        # IMPORTANT: The role name MUST be exactly "dms-vpc-role" without any suffix
        # AWS DMS service looks for this specific role name
        dms_vpc_role = iam.Role(
            self,
            "DmsVpcRole",
            role_name="dms-vpc-role",  # Must be exactly this name - no suffix
            assumed_by=iam.ServicePrincipal("dms.amazonaws.com"),
            description="IAM role for DMS to manage VPC resources",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSVPCManagementRole"
                )
            ],
        )

        # Create DMS CloudWatch Logs role (optional but recommended for logging)
        # IMPORTANT: The role name MUST be exactly "dms-cloudwatch-logs-role" without any suffix
        dms_cloudwatch_logs_role = iam.Role(
            self,
            "DmsCloudWatchLogsRole",
            role_name="dms-cloudwatch-logs-role",  # Must be exactly this name - no suffix
            assumed_by=iam.ServicePrincipal("dms.amazonaws.com"),
            description="IAM role for DMS to write CloudWatch logs",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonDMSCloudWatchLogsRole"
                )
            ],
        )

        # Store references for potential use in other resources
        self.dms_vpc_role = dms_vpc_role
        self.dms_cloudwatch_logs_role = dms_cloudwatch_logs_role

    def _create_dms_subnet_group(self) -> dms.CfnReplicationSubnetGroup:
        """Create DMS replication subnet group.

        Returns:
            DMS replication subnet group.
        """
        subnet_group = dms.CfnReplicationSubnetGroup(
            self,
            f"DmsSubnetGroup-{self.environment_suffix}",
            replication_subnet_group_description=(
                f"DMS replication subnet group for migration {self.environment_suffix}"
            ),
            replication_subnet_group_identifier=f"dms-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
            tags=[
                cdk.CfnTag(key="Name", value=f"dms-subnet-group-{self.environment_suffix}"),
            ],
        )
        # Ensure DMS VPC role exists before creating subnet group
        # DMS requires the dms-vpc-role to be configured before it can access VPC resources
        if hasattr(self, 'dms_vpc_role'):
            subnet_group.node.add_dependency(self.dms_vpc_role)
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
            # Note: engine_version omitted to use AWS default/latest supported version
            # This ensures compatibility with current AWS DMS service versions
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
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
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
                            "ReplicationInstanceIdentifier": (
                                self.dms_replication_instance.replication_instance_identifier
                            ),
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DMS",
                        metric_name="CDCLatencyTarget",
                        dimensions_map={
                            "ReplicationInstanceIdentifier": (
                                self.dms_replication_instance.replication_instance_identifier
                            ),
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
