"""
VPC Module - Creates VPC with public/private subnets, NAT gateways, and route tables.
Supports configurable CIDR ranges and multi-AZ deployment.
"""

from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from typing import List


class VpcModule(Construct):
    """
    VPC Module for multi-environment infrastructure.
    Creates VPC with public and private subnets across multiple AZs.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_cidr: str,
        availability_zones: int = 2,
        enable_nat_gateway: bool = True,
        version: str = "v2",
        **kwargs
    ):
        """
        Initialize VPC module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            vpc_cidr: CIDR block for the VPC
            availability_zones: Number of AZs to use (default: 2)
            enable_nat_gateway: Whether to create NAT gateways (default: True)
            version: Version suffix for resource naming (default: v2)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.az_count = availability_zones
        self.version = version

        # Get available AZs
        self.azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            f"vpc-{version}-{environment_suffix}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{version}-{environment_suffix}",
                "Module": "vpc",
                "Version": version
            }
        )

        # Create Internet Gateway
        self.igw = InternetGateway(
            self,
            f"igw-{version}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{version}-{environment_suffix}",
                "Version": version
            }
        )

        # Create subnets
        self.public_subnets: List[Subnet] = []
        self.private_subnets: List[Subnet] = []
        self.nat_gateways: List[NatGateway] = []
        self.eips: List[Eip] = []

        # Calculate subnet CIDRs (split VPC CIDR into smaller subnets)
        # For simplicity, we'll create /20 subnets (4096 IPs each)
        # Public: first half, Private: second half
        base_ip = vpc_cidr.split('/')[0]
        base_octets = base_ip.split('.')

        for i in range(self.az_count):
            # Public subnet
            public_subnet = Subnet(
                self,
                f"public-subnet-{version}-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{i * 16}.0/20",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{version}-{i}-{environment_suffix}",
                    "Type": "public",
                    "Version": version
                }
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"private-subnet-{version}-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{128 + i * 16}.0/20",
                availability_zone=Fn.element(self.azs.names, i),
                tags={
                    "Name": f"private-subnet-{version}-{i}-{environment_suffix}",
                    "Type": "private",
                    "Version": version
                }
            )
            self.private_subnets.append(private_subnet)

            # Create NAT Gateway for each AZ (if enabled)
            if enable_nat_gateway:
                eip = Eip(
                    self,
                    f"nat-eip-{version}-{i}-{environment_suffix}",
                    domain="vpc",
                    tags={
                        "Name": f"nat-eip-{version}-{i}-{environment_suffix}",
                        "Version": version
                    }
                )
                self.eips.append(eip)

                nat_gw = NatGateway(
                    self,
                    f"nat-gateway-{version}-{i}-{environment_suffix}",
                    allocation_id=eip.id,
                    subnet_id=public_subnet.id,
                    tags={
                        "Name": f"nat-gateway-{version}-{i}-{environment_suffix}",
                        "Version": version
                    }
                )
                self.nat_gateways.append(nat_gw)

        # Create route tables
        # Public route table (one for all public subnets)
        self.public_route_table = RouteTable(
            self,
            f"public-rt-{version}-{environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"public-rt-{version}-{environment_suffix}",
                "Version": version
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public-rt-assoc-{version}-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
            )

        # Private route tables (one per AZ with NAT gateway)
        self.private_route_tables: List[RouteTable] = []
        for i in range(self.az_count):
            routes = []
            if enable_nat_gateway and i < len(self.nat_gateways):
                routes.append(
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=self.nat_gateways[i].id,
                    )
                )

            private_rt = RouteTable(
                self,
                f"private-rt-{version}-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                route=routes,
                tags={
                    "Name": f"private-rt-{version}-{i}-{environment_suffix}",
                    "Version": version
                }
            )
            self.private_route_tables.append(private_rt)

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"private-rt-assoc-{version}-{i}-{environment_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=private_rt.id,
            )

    def get_vpc_id(self) -> str:
        """Return VPC ID."""
        return self.vpc.id

    def get_public_subnet_ids(self) -> List[str]:
        """Return list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    def get_private_subnet_ids(self) -> List[str]:
        """Return list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
