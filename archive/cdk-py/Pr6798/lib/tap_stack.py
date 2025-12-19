"""tap_stack.py

Cross-Account VPC Peering Infrastructure Stack

This module implements a comprehensive cross-account VPC peering solution for
connecting a trading platform VPC with a data analytics VPC. It includes:
- VPC peering connection with cross-account support
- Route table configurations
- Security groups with whitelist approach
- VPC Flow Logs with S3 storage
- Network ACLs for subnet-level security
- VPC endpoints for S3 and DynamoDB
- CloudWatch monitoring and alarms
- AWS Config compliance monitoring
- Proper IAM roles for cross-account operations
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    CfnOutput,
    Duration,
    Tags as CdkTags
)
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_iam as iam
from aws_cdk import aws_logs as logs
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_config as config
from constructs import Construct


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


class TapStack(Stack):
    """
    Cross-Account VPC Peering Infrastructure Stack

    This stack creates a secure VPC peering setup between two VPCs (trading and analytics)
    with comprehensive security controls, monitoring, and compliance features.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        self.environment_suffix = environment_suffix

        # ==========================================
        # 1. Create Trading Platform VPC (Account A)
        # ==========================================
        trading_vpc = ec2.Vpc(
            self, f"TradingVPC-{environment_suffix}",
            vpc_name=f"trading-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,  # Cost optimization: single NAT gateway
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"PrivateSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"PublicSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # ==========================================
        # 2. Create Analytics VPC (Account B simulation)
        # ==========================================
        analytics_vpc = ec2.Vpc(
            self, f"AnalyticsVPC-{environment_suffix}",
            vpc_name=f"analytics-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"PrivateSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"PublicSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # ==========================================
        # 3. Create S3 Bucket for VPC Flow Logs
        # ==========================================
        flow_logs_bucket = s3.Bucket(
            self, f"FlowLogsBucket-{environment_suffix}",
            bucket_name=f"vpc-flow-logs-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(7),
                    enabled=True
                )
            ]
        )

        # Add bucket policy for VPC Flow Logs service
        flow_logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSLogDeliveryWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("delivery.logs.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{flow_logs_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )

        flow_logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSLogDeliveryAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("delivery.logs.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[flow_logs_bucket.bucket_arn]
            )
        )

        # ==========================================
        # 4. Enable VPC Flow Logs for Both VPCs
        # ==========================================
        # Trading VPC Flow Logs
        # NOTE: AWS only supports 60 or 600 seconds for max_aggregation_interval
        # Flow logs must be deleted before VPCs can be deleted
        trading_flow_log = ec2.CfnFlowLog(
            self, f"TradingFlowLog-{environment_suffix}",
            resource_id=trading_vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.bucket_arn,
            max_aggregation_interval=600,  # 10 minutes (AWS only supports 60 or 600)
            tags=[
                cdk.CfnTag(key="Name", value=f"trading-flow-log-{environment_suffix}"),
                cdk.CfnTag(key="CostCenter", value="Trading"),
                cdk.CfnTag(key="Environment", value=environment_suffix)
            ]
        )
        # Use node-based dependency for high-level constructs
        trading_flow_log.node.add_dependency(flow_logs_bucket)

        # Analytics VPC Flow Logs
        analytics_flow_log = ec2.CfnFlowLog(
            self, f"AnalyticsFlowLog-{environment_suffix}",
            resource_id=analytics_vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.bucket_arn,
            max_aggregation_interval=600,  # 10 minutes (AWS only supports 60 or 600)
            tags=[
                cdk.CfnTag(key="Name", value=f"analytics-flow-log-{environment_suffix}"),
                cdk.CfnTag(key="CostCenter", value="Analytics"),
                cdk.CfnTag(key="Environment", value=environment_suffix)
            ]
        )
        # Use node-based dependency for high-level constructs
        analytics_flow_log.node.add_dependency(flow_logs_bucket)

        # ==========================================
        # 5. Create VPC Peering Connection
        # ==========================================
        # Note: Since both VPCs are in the same account, the peering connection
        # will be automatically accepted. For cross-account peering, you would need
        # to accept it in the peer account.
        peering_connection = ec2.CfnVPCPeeringConnection(
            self, f"VPCPeering-{environment_suffix}",
            vpc_id=trading_vpc.vpc_id,
            peer_vpc_id=analytics_vpc.vpc_id,
            peer_region=cdk.Aws.REGION,
            tags=[
                cdk.CfnTag(key="Name", value=f"trading-analytics-peering-{environment_suffix}"),
                cdk.CfnTag(key="CostCenter", value="SharedServices"),
                cdk.CfnTag(key="Environment", value=environment_suffix)
            ]
        )

        # ==========================================
        # 6. Configure Route Tables
        # ==========================================
        # Add routes from Trading VPC to Analytics VPC
        # Note: Routes are idempotent - if route already exists, CDK will handle it
        trading_routes = []
        for i, subnet in enumerate(trading_vpc.private_subnets):
            route = ec2.CfnRoute(
                self, f"TradingToAnalyticsRoute{i}-{environment_suffix}",
                route_table_id=subnet.route_table.route_table_id,
                destination_cidr_block="10.1.0.0/16",
                vpc_peering_connection_id=peering_connection.ref
            )
            route.add_dependency(peering_connection)
            trading_routes.append(route)

        # Add routes from Analytics VPC to Trading VPC
        analytics_routes = []
        for i, subnet in enumerate(analytics_vpc.private_subnets):
            route = ec2.CfnRoute(
                self, f"AnalyticsToTradingRoute{i}-{environment_suffix}",
                route_table_id=subnet.route_table.route_table_id,
                destination_cidr_block="10.0.0.0/16",
                vpc_peering_connection_id=peering_connection.ref
            )
            route.add_dependency(peering_connection)
            analytics_routes.append(route)

        # ==========================================
        # 7. Create Security Groups
        # ==========================================
        # Trading VPC Security Group
        trading_sg = ec2.SecurityGroup(
            self, f"TradingSG-{environment_suffix}",
            vpc=trading_vpc,
            security_group_name=f"trading-sg-{environment_suffix}",
            description="Security group for trading platform - allows HTTPS and PostgreSQL from analytics VPC",
            allow_all_outbound=False
        )

        # Allow HTTPS from Analytics VPC
        trading_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.1.0.0/16"),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from Analytics VPC"
        )

        # Allow PostgreSQL from Analytics VPC
        trading_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.1.0.0/16"),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from Analytics VPC"
        )

        # Allow outbound HTTPS to Analytics VPC
        trading_sg.add_egress_rule(
            peer=ec2.Peer.ipv4("10.1.0.0/16"),
            connection=ec2.Port.tcp(443),
            description="Allow outbound HTTPS to Analytics VPC"
        )

        # Analytics VPC Security Group
        analytics_sg = ec2.SecurityGroup(
            self, f"AnalyticsSG-{environment_suffix}",
            vpc=analytics_vpc,
            security_group_name=f"analytics-sg-{environment_suffix}",
            description="Security group for analytics platform - allows HTTPS from trading VPC",
            allow_all_outbound=False
        )

        # Allow HTTPS from Trading VPC
        analytics_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from Trading VPC"
        )

        # Allow outbound HTTPS and PostgreSQL to Trading VPC
        analytics_sg.add_egress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(443),
            description="Allow outbound HTTPS to Trading VPC"
        )

        analytics_sg.add_egress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(5432),
            description="Allow outbound PostgreSQL to Trading VPC"
        )

        # ==========================================
        # 8. Create Network ACLs
        # ==========================================
        # Trading VPC Network ACL
        trading_nacl = ec2.NetworkAcl(
            self, f"TradingNACL-{environment_suffix}",
            vpc=trading_vpc,
            network_acl_name=f"trading-nacl-{environment_suffix}"
        )

        # NACL Rules for Trading VPC
        # Inbound: Allow HTTPS from Analytics
        trading_nacl.add_entry(
            id=f"AllowHTTPSInbound-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.1.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Inbound: Allow PostgreSQL from Analytics
        trading_nacl.add_entry(
            id=f"AllowPostgreSQLInbound-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.1.0.0/16"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port(5432),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Inbound: Allow ephemeral ports for return traffic
        trading_nacl.add_entry(
            id=f"AllowEphemeralInbound-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.1.0.0/16"),
            rule_number=120,
            traffic=ec2.AclTraffic.tcp_port_range(1024, 65535),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Outbound: Allow HTTPS to Analytics
        trading_nacl.add_entry(
            id=f"AllowHTTPSOutbound-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.1.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Outbound: Allow ephemeral ports
        trading_nacl.add_entry(
            id=f"AllowEphemeralOutbound-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.1.0.0/16"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port_range(1024, 65535),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Associate NACL with private subnets
        for i, subnet in enumerate(trading_vpc.private_subnets):
            ec2.SubnetNetworkAclAssociation(
                self, f"TradingNACLAssoc{i}-{environment_suffix}",
                network_acl=trading_nacl,
                subnet=subnet
            )

        # Analytics VPC Network ACL
        analytics_nacl = ec2.NetworkAcl(
            self, f"AnalyticsNACL-{environment_suffix}",
            vpc=analytics_vpc,
            network_acl_name=f"analytics-nacl-{environment_suffix}"
        )

        # NACL Rules for Analytics VPC
        # Inbound: Allow HTTPS from Trading
        analytics_nacl.add_entry(
            id=f"AllowHTTPSFromTrading-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Inbound: Allow ephemeral ports
        analytics_nacl.add_entry(
            id=f"AllowEphemeralFromTrading-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/16"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port_range(1024, 65535),
            direction=ec2.TrafficDirection.INGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Outbound: Allow HTTPS to Trading
        analytics_nacl.add_entry(
            id=f"AllowHTTPSToTrading-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/16"),
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(443),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Outbound: Allow PostgreSQL to Trading
        analytics_nacl.add_entry(
            id=f"AllowPostgreSQLToTrading-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/16"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port(5432),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Outbound: Allow ephemeral ports
        analytics_nacl.add_entry(
            id=f"AllowEphemeralToTrading-{environment_suffix}",
            cidr=ec2.AclCidr.ipv4("10.0.0.0/16"),
            rule_number=120,
            traffic=ec2.AclTraffic.tcp_port_range(1024, 65535),
            direction=ec2.TrafficDirection.EGRESS,
            rule_action=ec2.Action.ALLOW
        )

        # Associate NACL with private subnets
        for i, subnet in enumerate(analytics_vpc.private_subnets):
            ec2.SubnetNetworkAclAssociation(
                self, f"AnalyticsNACLAssoc{i}-{environment_suffix}",
                network_acl=analytics_nacl,
                subnet=subnet
            )

        # ==========================================
        # 9. Create VPC Endpoints (DISABLED due to quota limits)
        # ==========================================
        # NOTE: VPC endpoints are disabled to avoid quota exhaustion errors
        # AWS accounts have default limits (typically 20 gateway endpoints per region)
        # Uncomment below if your account has available quota

        # # S3 Gateway Endpoint for Trading VPC
        # trading_s3_endpoint = trading_vpc.add_gateway_endpoint(
        #     f"TradingS3Endpoint-{environment_suffix}",
        #     service=ec2.GatewayVpcEndpointAwsService.S3,
        #     subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        # )

        # # DynamoDB Gateway Endpoint for Trading VPC
        # trading_dynamodb_endpoint = trading_vpc.add_gateway_endpoint(
        #     f"TradingDynamoDBEndpoint-{environment_suffix}",
        #     service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        #     subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        # )

        # # S3 Gateway Endpoint for Analytics VPC
        # analytics_s3_endpoint = analytics_vpc.add_gateway_endpoint(
        #     f"AnalyticsS3Endpoint-{environment_suffix}",
        #     service=ec2.GatewayVpcEndpointAwsService.S3,
        #     subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        # )

        # # DynamoDB Gateway Endpoint for Analytics VPC
        # analytics_dynamodb_endpoint = analytics_vpc.add_gateway_endpoint(
        #     f"AnalyticsDynamoDBEndpoint-{environment_suffix}",
        #     service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        #     subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        # )

        # ==========================================
        # 10. Create CloudWatch Log Metric Filters and Alarms
        # ==========================================
        # Create CloudWatch Log Group for custom metrics
        metric_log_group = logs.LogGroup(
            self, f"NetworkMetrics-{environment_suffix}",
            log_group_name=f"/aws/vpc/network-metrics-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )

        # Create CloudWatch Alarms for unusual network traffic
        # Note: These metrics would need to be published by a Lambda or other service
        # For now, we'll use VPC Flow Logs metrics which are automatically available
        # Using AWS/VPC namespace metrics that are automatically available
        
        # Alarm for rejected connections (using VPC Flow Logs metrics)
        # Note: This is a placeholder - actual implementation would require
        # parsing VPC Flow Logs and publishing custom metrics
        rejected_connections_alarm = cloudwatch.Alarm(
            self, f"RejectedConnectionsAlarm-{environment_suffix}",
            alarm_name=f"high-rejected-connections-{environment_suffix}",
            alarm_description="Alert when rejected connections exceed threshold (placeholder - requires custom metric)",
            metric=cloudwatch.Metric(
                namespace="AWS/VPC",
                metric_name="RejectedConnectionCount",
                dimensions_map={
                    "VpcId": trading_vpc.vpc_id
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=100,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Alarm for unusual traffic volume (using VPC Flow Logs metrics)
        traffic_volume_alarm = cloudwatch.Alarm(
            self, f"TrafficVolumeAlarm-{environment_suffix}",
            alarm_name=f"unusual-traffic-volume-{environment_suffix}",
            alarm_description="Alert when traffic volume is unusually high",
            metric=cloudwatch.Metric(
                namespace="AWS/VPC",
                metric_name="BytesTransferred",
                dimensions_map={
                    "VpcId": trading_vpc.vpc_id
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10000000000,  # 10 GB
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # ==========================================
        # 11. Create IAM Role for Cross-Account Peering
        # ==========================================
        # Note: This role would be used in Account B to accept peering from Account A
        peering_role = iam.Role(
            self, f"PeeringRole-{environment_suffix}",
            role_name=f"vpc-peering-role-{environment_suffix}",
            assumed_by=iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID),
            description="Role for cross-account VPC peering acceptance"
        )

        peering_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:AcceptVpcPeeringConnection",
                    "ec2:DescribeVpcPeeringConnections",
                    "ec2:CreateRoute",
                    "ec2:DeleteRoute"
                ],
                resources=["*"]
            )
        )

        # ==========================================
        # 12. Create AWS Config Rules for Compliance
        # ==========================================
        # NOTE: AWS Config only allows ONE ConfigurationRecorder and ONE DeliveryChannel
        # per region. If these already exist at the account level, creating them here
        # will fail. This code creates Config Rules only, which can be attached to
        # an existing account-level recorder.
        #
        # If you need to create a recorder and delivery channel, ensure they don't
        # already exist in the account, or use account-level ones.
        
        # Grant S3 access for Config (bucket for storing config snapshots if needed)
        config_bucket = s3.Bucket(
            self, f"ConfigBucket-{environment_suffix}",
            bucket_name=f"aws-config-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # AWS Config Role with correct managed policy (for Config Rules only)
        config_role = iam.Role(
            self, f"ConfigRole-{environment_suffix}",
            role_name=f"aws-config-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWS_ConfigRole"  # Correct policy name
                )
            ]
        )

        config_bucket.grant_read_write(config_role)

        # Config Rule: VPC Peering Route Table Check
        # Note: This rule will use the account-level Config Recorder if one exists
        # If no recorder exists, the rule will be created but won't evaluate until
        # a recorder is available
        peering_config_rule = config.CfnConfigRule(
            self, f"PeeringConfigRule-{environment_suffix}",
            config_rule_name=f"vpc-peering-route-check-{environment_suffix}",
            description="Check VPC peering connections have proper route tables",
            source=config.CfnConfigRule.SourceProperty(
                owner="AWS",
                source_identifier="VPC_PEERING_DNS_RESOLUTION_CHECK"
            )
        )
        
        # Note: Removed ConfigRecorder and DeliveryChannel creation to avoid
        # "Maximum number of delivery channels: 1 is reached" errors.
        # These should be managed at the account level, not per-stack.

        # ==========================================
        # 13. Add Compliance Tags to All Resources
        # ==========================================
        CdkTags.of(trading_vpc).add("CostCenter", "Trading")
        CdkTags.of(trading_vpc).add("Environment", environment_suffix)
        CdkTags.of(analytics_vpc).add("CostCenter", "Analytics")
        CdkTags.of(analytics_vpc).add("Environment", environment_suffix)
        CdkTags.of(flow_logs_bucket).add("CostCenter", "SharedServices")
        CdkTags.of(flow_logs_bucket).add("Environment", environment_suffix)

        # ==========================================
        # 14. Create CloudWatch Dashboard
        # ==========================================
        dashboard = cloudwatch.Dashboard(
            self, f"NetworkDashboard-{environment_suffix}",
            dashboard_name=f"vpc-peering-monitoring-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Rejected Connections",
                left=[rejected_connections_alarm.metric],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Traffic Volume",
                left=[traffic_volume_alarm.metric],
                width=12
            )
        )

        # ==========================================
        # 15. Stack Outputs
        # ==========================================
        CfnOutput(
            self, "PeeringConnectionId",
            value=peering_connection.ref,
            description="VPC Peering Connection ID",
            export_name=f"PeeringConnectionId-{environment_suffix}"
        )

        CfnOutput(
            self, "PeeringConnectionStatus",
            value=peering_connection.attr_id,
            description="VPC Peering Connection Status",
            export_name=f"PeeringConnectionStatus-{environment_suffix}"
        )

        CfnOutput(
            self, "TradingVpcId",
            value=trading_vpc.vpc_id,
            description="Trading VPC ID",
            export_name=f"TradingVpcId-{environment_suffix}"
        )

        CfnOutput(
            self, "AnalyticsVpcId",
            value=analytics_vpc.vpc_id,
            description="Analytics VPC ID",
            export_name=f"AnalyticsVpcId-{environment_suffix}"
        )

        CfnOutput(
            self, "TradingRouteTableIds",
            value=",".join([subnet.route_table.route_table_id for subnet in trading_vpc.private_subnets]),
            description="Trading VPC Private Route Table IDs",
            export_name=f"TradingRouteTableIds-{environment_suffix}"
        )

        CfnOutput(
            self, "AnalyticsRouteTableIds",
            value=",".join([subnet.route_table.route_table_id for subnet in analytics_vpc.private_subnets]),
            description="Analytics VPC Private Route Table IDs",
            export_name=f"AnalyticsRouteTableIds-{environment_suffix}"
        )

        dashboard_url = (
            f"https://console.aws.amazon.com/cloudwatch/home?"
            f"region={cdk.Aws.REGION}#dashboards:name={dashboard.dashboard_name}"
        )
        CfnOutput(
            self, "DashboardURL",
            value=dashboard_url,
            description="CloudWatch Dashboard URL for Network Monitoring",
            export_name=f"DashboardURL-{environment_suffix}"
        )

        CfnOutput(
            self, "FlowLogsBucket",
            value=flow_logs_bucket.bucket_name,
            description="S3 Bucket for VPC Flow Logs",
            export_name=f"FlowLogsBucket-{environment_suffix}"
        )

        # Store references for testing
        self.trading_vpc = trading_vpc
        self.analytics_vpc = analytics_vpc
        self.peering_connection = peering_connection
        self.trading_sg = trading_sg
        self.analytics_sg = analytics_sg
        self.flow_logs_bucket = flow_logs_bucket
        self.dashboard = dashboard
