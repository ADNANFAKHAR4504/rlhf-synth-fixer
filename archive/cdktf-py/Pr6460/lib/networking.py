"""Networking infrastructure module for payment processing application."""

from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import (
    DataAwsAvailabilityZones,
)
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.vpc_endpoint_route_table_association import (
    VpcEndpointRouteTableAssociation,
)
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class NetworkingInfrastructure(Construct):
    """Networking infrastructure with VPC, subnets, and routing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, region: str):
        """
        Initialize networking infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            region: AWS region
        """
        super().__init__(scope, construct_id)

        # Get available AZs
        azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available",
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
            },
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
            },
        )

        # Create public subnets in 3 AZs
        self.public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public",
                },
            )
            self.public_subnets.append(subnet)

        # Create private subnets in 3 AZs
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private",
                },
            )
            self.private_subnets.append(subnet)

        # Create single EIP for NAT Gateway (to avoid EIP limit)
        # Note: EIP depends on IGW being attached to VPC
        nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            depends_on=[igw],
            tags={
                "Name": f"payment-nat-eip-{environment_suffix}",
            },
        )

        # Create single NAT Gateway in first public subnet (cost optimization)
        # Note: NAT Gateway depends on EIP and public subnet
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnets[0].id,
            depends_on=[nat_eip, self.public_subnets[0]],
            tags={
                "Name": f"payment-nat-{environment_suffix}",
            },
        )

        # Create public route table
        public_rt = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id,
                )
            ],
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
            },
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # Create single private route table for all private subnets
        private_rt = RouteTable(
            self,
            "private_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id,
                )
            ],
            tags={
                "Name": f"payment-private-rt-{environment_suffix}",
            },
        )

        # Associate all private subnets with the single private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
            )

        # VPC Gateway Endpoint for S3
        # This keeps S3 traffic within AWS network instead of going through NAT Gateway
        s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{region}.s3",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"payment-s3-endpoint-{environment_suffix}",
            },
        )

        # Associate S3 endpoint with private route table
        VpcEndpointRouteTableAssociation(
            self,
            "s3_endpoint_rt_assoc",
            route_table_id=private_rt.id,
            vpc_endpoint_id=s3_endpoint.id,
        )

        # VPC Flow Logs for security auditing and compliance (PCI DSS 10.2.7)
        # Create CloudWatch Log Group for VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/flowlogs/payment-{environment_suffix}",
            retention_in_days=90,  # PCI DSS requires minimum 90 days retention
            tags={
                "Name": f"payment-vpc-flow-logs-{environment_suffix}",
            },
        )

        # IAM Role for VPC Flow Logs
        flow_log_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }
            ],
        }

        flow_log_role = IamRole(
            self,
            "vpc_flow_log_role",
            name=f"payment-vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps(flow_log_role_policy),
            tags={
                "Name": f"payment-vpc-flow-log-role-{environment_suffix}",
            },
        )

        # IAM Policy for VPC Flow Logs to write to CloudWatch
        flow_log_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams",
                    ],
                    "Resource": "*",
                }
            ],
        }

        IamRolePolicy(
            self,
            "vpc_flow_log_policy",
            name=f"payment-vpc-flow-log-policy-{environment_suffix}",
            role=flow_log_role.id,
            policy=json.dumps(flow_log_policy),
        )

        # Create VPC Flow Log
        FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=self.vpc.id,
            traffic_type="ALL",  # Capture all traffic (ACCEPT, REJECT, ALL)
            iam_role_arn=flow_log_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=flow_log_group.arn,
            max_aggregation_interval=60,  # 1 minute aggregation for faster detection
            tags={
                "Name": f"payment-vpc-flow-log-{environment_suffix}",
            },
        )

    @property
    def vpc_id(self) -> str:
        """Return VPC ID."""
        return self.vpc.id

    @property
    def public_subnet_ids(self) -> list:
        """Return list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    @property
    def private_subnet_ids(self) -> list:
        """Return list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
