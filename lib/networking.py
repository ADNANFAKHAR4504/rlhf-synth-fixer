"""Networking infrastructure module for payment processing application."""

from constructs import Construct
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


class NetworkingInfrastructure(Construct):
    """Networking infrastructure with VPC, subnets, and routing."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, region: str):
        """
        Initialize networking infrastructure.

        Args:
            scope: The scope in which to define this construct
            id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            region: AWS region
        """
        super().__init__(scope, id)

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
                availability_zone=f"${{element({azs.names}, {i})}}",
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
                availability_zone=f"${{element({azs.names}, {i})}}",
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private",
                },
            )
            self.private_subnets.append(subnet)

        # Create EIPs for NAT Gateways
        nat_eips = []
        for i in range(3):
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i+1}-{environment_suffix}",
                },
            )
            nat_eips.append(eip)

        # Create NAT Gateways in public subnets
        nat_gateways = []
        for i in range(3):
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=nat_eips[i].id,
                subnet_id=self.public_subnets[i].id,
                tags={
                    "Name": f"payment-nat-{i+1}-{environment_suffix}",
                },
            )
            nat_gateways.append(nat)

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

        # Create private route tables (one per AZ for NAT Gateway)
        for i, subnet in enumerate(self.private_subnets):
            private_rt = RouteTable(
                self,
                f"private_route_table_{i}",
                vpc_id=self.vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gateways[i].id,
                    )
                ],
                tags={
                    "Name": f"payment-private-rt-{i+1}-{environment_suffix}",
                },
            )

            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
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
