"""vpc_stack.py

This module defines VPC stacks for the multi-account network architecture.
It creates VPCs with private subnets, Transit Gateway attachments, security groups,
VPC Flow Logs, and Route53 configurations.
"""

from typing import Optional, List
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class VpcStackProps(cdk.NestedStackProps):
    """Properties for VPC Stack.

    Args:
        environment_suffix: Environment suffix for resource naming
        vpc_name: Name identifier for the VPC (e.g., 'production', 'development')
        vpc_cidr: CIDR block for the VPC
        transit_gateway_id: ID of the Transit Gateway to attach to
        tgw_route_table_id: ID of the Transit Gateway route table for this VPC
        availability_zones: Number of AZs to use (default: 2)
    """
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc_name: Optional[str] = None,
        vpc_cidr: Optional[str] = None,
        transit_gateway_id: Optional[str] = None,
        tgw_route_table_id: Optional[str] = None,
        availability_zones: int = 2,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc_name = vpc_name
        self.vpc_cidr = vpc_cidr
        self.transit_gateway_id = transit_gateway_id
        self.tgw_route_table_id = tgw_route_table_id
        self.availability_zones = availability_zones


class VpcStack(cdk.NestedStack):
    """Creates a VPC with Transit Gateway attachment and Flow Logs.

    This stack provisions:
    - VPC with private subnets only (no Internet Gateway)
    - Transit Gateway attachment
    - Security groups with least-privilege rules
    - VPC Flow Logs to S3 with lifecycle policies
    - Proper tagging for cost allocation
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: VpcStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix or 'dev'
        vpc_name = props.vpc_name or 'default'
        vpc_cidr = props.vpc_cidr or '10.0.0.0/16'

        # Create S3 bucket for VPC Flow Logs
        # Note: bucket_name is NOT set to allow CloudFormation to generate a unique name
        # Note: auto_delete_objects is NOT enabled to avoid race conditions with VPC Flow Logs
        #       Buckets will be manually cleaned up after testing
        flow_logs_bucket = s3.Bucket(
            self,
            f"FlowLogsBucket{vpc_name.title()}{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            removal_policy=RemovalPolicy.DESTROY,  # Allow destruction for test environments
            lifecycle_rules=[
                s3.LifecycleRule(
                    id=f"ExpireOldLogs-{vpc_name}",
                    enabled=True,
                    expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                )
            ],
        )

        # Add tags to S3 bucket
        cdk.Tags.of(flow_logs_bucket).add("Name", f"vpc-flow-logs-{vpc_name}-{environment_suffix}")
        cdk.Tags.of(flow_logs_bucket).add("Environment", vpc_name)
        cdk.Tags.of(flow_logs_bucket).add("CostCenter", "networking")
        cdk.Tags.of(flow_logs_bucket).add("ManagedBy", "cdk")

        # Create VPC with private subnets only (no NAT Gateways or Internet Gateways)
        # Using CfnVPC for more control over configuration
        self.vpc = ec2.Vpc(
            self,
            f"Vpc{vpc_name.title()}{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr(vpc_cidr),
            max_azs=props.availability_zones,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            # Create only private subnets, no public subnets or NAT Gateways
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{vpc_name}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
            # No NAT Gateways to reduce costs
            nat_gateways=0,
        )

        # Add tags to VPC
        cdk.Tags.of(self.vpc).add("Name", f"vpc-{vpc_name}-{environment_suffix}")
        cdk.Tags.of(self.vpc).add("Environment", vpc_name)
        cdk.Tags.of(self.vpc).add("CostCenter", "networking")
        cdk.Tags.of(self.vpc).add("ManagedBy", "cdk")

        # Create VPC Flow Logs to S3 (capture ALL traffic)
        log_format = (
            "${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} "
            "${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} "
            "${end} ${action} ${log-status}"
        )
        ec2.CfnFlowLog(
            self,
            f"FlowLog{vpc_name.title()}{environment_suffix}",
            resource_id=self.vpc.vpc_id,
            resource_type="VPC",
            traffic_type="ALL",  # Capture ALL traffic (not just ACCEPT or REJECT)
            log_destination_type="s3",
            log_destination=flow_logs_bucket.bucket_arn,
            log_format=log_format,
            max_aggregation_interval=600,  # 10 minutes
            tags=[
                cdk.CfnTag(key="Name", value=f"flow-log-{vpc_name}-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value=vpc_name),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Create Transit Gateway Attachment if Transit Gateway ID is provided
        if props.transit_gateway_id:
            # Get private subnet IDs for attachment
            # Explicitly select subnets to ensure they exist before attachment
            private_subnets = self.vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ).subnets

            private_subnet_ids = [subnet.subnet_id for subnet in private_subnets]

            self.tgw_attachment = ec2.CfnTransitGatewayAttachment(
                self,
                f"TgwAttachment{vpc_name.title()}{environment_suffix}",
                transit_gateway_id=props.transit_gateway_id,
                vpc_id=self.vpc.vpc_id,
                subnet_ids=private_subnet_ids,
                tags=[
                    cdk.CfnTag(key="Name", value=f"tgw-attach-{vpc_name}-{environment_suffix}"),
                    cdk.CfnTag(key="Environment", value=vpc_name),
                    cdk.CfnTag(key="CostCenter", value="networking"),
                    cdk.CfnTag(key="ManagedBy", value="cdk"),
                ]
            )

            # Add explicit dependencies on subnets
            for subnet in private_subnets:
                self.tgw_attachment.node.add_dependency(subnet)

            # Associate attachment with Transit Gateway route table
            if props.tgw_route_table_id:
                ec2.CfnTransitGatewayRouteTableAssociation(
                    self,
                    f"TgwRtAssoc{vpc_name.title()}{environment_suffix}",
                    transit_gateway_attachment_id=self.tgw_attachment.ref,
                    transit_gateway_route_table_id=props.tgw_route_table_id,
                )

                # Enable route propagation to Transit Gateway route table
                ec2.CfnTransitGatewayRouteTablePropagation(
                    self,
                    f"TgwRtProp{vpc_name.title()}{environment_suffix}",
                    transit_gateway_attachment_id=self.tgw_attachment.ref,
                    transit_gateway_route_table_id=props.tgw_route_table_id,
                )

            # Add routes to VPC route tables pointing to Transit Gateway
            for subnet in self.vpc.private_subnets:
                # Route all non-local traffic through Transit Gateway
                # This enables communication with other VPCs
                ec2.CfnRoute(
                    self,
                    f"TgwRoute{vpc_name.title()}{subnet.node.id}{environment_suffix}",
                    route_table_id=subnet.route_table.route_table_id,
                    destination_cidr_block="10.0.0.0/8",  # All private IPs in 10.x.x.x range
                    transit_gateway_id=props.transit_gateway_id,
                ).add_dependency(self.tgw_attachment)

        # Create default security group for inter-VPC communication
        self.default_sg = ec2.SecurityGroup(
            self,
            f"DefaultSg{vpc_name.title()}{environment_suffix}",
            vpc=self.vpc,
            description=f"Default security group for {vpc_name} VPC",
            security_group_name=f"{vpc_name}-default-sg-{environment_suffix}",
            allow_all_outbound=True,
        )

        # Add tags to security group
        cdk.Tags.of(self.default_sg).add("Name", f"{vpc_name}-default-sg-{environment_suffix}")
        cdk.Tags.of(self.default_sg).add("Environment", vpc_name)
        cdk.Tags.of(self.default_sg).add("CostCenter", "networking")
        cdk.Tags.of(self.default_sg).add("ManagedBy", "cdk")

        # Store VPC attributes for cross-stack references
        self.vpc_id = self.vpc.vpc_id
        self.vpc_cidr_block = vpc_cidr

        # Outputs
        cdk.CfnOutput(
            self,
            f"{vpc_name.title()}VpcId",
            value=self.vpc_id,
            description=f"{vpc_name} VPC ID",
            export_name=f"{vpc_name.title()}VpcId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            f"{vpc_name.title()}VpcCidr",
            value=self.vpc_cidr_block,
            description=f"{vpc_name} VPC CIDR Block",
            export_name=f"{vpc_name.title()}VpcCidr-{environment_suffix}"
        )

        if props.transit_gateway_id:
            cdk.CfnOutput(
                self,
                f"{vpc_name.title()}TgwAttachmentId",
                value=self.tgw_attachment.ref,
                description=f"{vpc_name} Transit Gateway Attachment ID",
                export_name=f"{vpc_name.title()}TgwAttachmentId-{environment_suffix}"
            )
