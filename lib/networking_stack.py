"""Networking Stack - VPC, Subnets, NAT Gateways, Flow Logs."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class NetworkingStack(Construct):
    """Networking infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize networking stack."""
        super().__init__(scope, construct_id)

        # VPC Configuration
        self._vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
            },
        )

        # Availability Zones
        azs = [
            f"{aws_region}a",
            f"{aws_region}b",
            f"{aws_region}c",
        ]

        # Public Subnets (for ALB)
        self._public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self._vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public",
                },
            )
            self._public_subnets.append(subnet)

        # Private Subnets (for API servers and database)
        self._private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self._vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private",
                },
            )
            self._private_subnets.append(subnet)

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self._vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
            },
        )

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self._vpc.id,
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
        for i, subnet in enumerate(self._public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, subnet in enumerate(self._public_subnets):
            # Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i+1}-{environment_suffix}",
                },
            )

            # NAT Gateway
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"payment-nat-{i+1}-{environment_suffix}",
                },
            )
            nat_gateways.append(nat)

        # Private Route Tables (one per AZ)
        for i, nat in enumerate(nat_gateways):
            private_rt = RouteTable(
                self,
                f"private_rt_{i}",
                vpc_id=self._vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id,
                    )
                ],
                tags={
                    "Name": f"payment-private-rt-{i+1}-{environment_suffix}",
                },
            )

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=self._private_subnets[i].id,
                route_table_id=private_rt.id,
            )

        # VPC Flow Logs
        # CloudWatch Log Group for Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/payment-flowlogs-{environment_suffix}",
            retention_in_days=7,
        )

        # IAM Role for Flow Logs
        flow_log_role = IamRole(
            self,
            "vpc_flow_log_role",
            name=f"vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
        )

        # IAM Policy for Flow Logs
        IamRolePolicy(
            self,
            "vpc_flow_log_policy",
            name=f"vpc-flow-log-policy-{environment_suffix}",
            role=flow_log_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "*"
                }]
            }),
        )

        # VPC Flow Log
        FlowLog(
            self,
            "vpc_flow_log",
            iam_role_arn=flow_log_role.arn,
            log_destination=flow_log_group.arn,
            traffic_type="ALL",
            vpc_id=self._vpc.id,
            tags={
                "Name": f"payment-vpc-flowlog-{environment_suffix}",
            },
        )

    @property
    def vpc_id(self) -> str:
        """Return VPC ID."""
        return self._vpc.id

    @property
    def public_subnet_ids(self) -> list:
        """Return list of public subnet IDs."""
        return [subnet.id for subnet in self._public_subnets]

    @property
    def private_subnet_ids(self) -> list:
        """Return list of private subnet IDs."""
        return [subnet.id for subnet in self._private_subnets]
