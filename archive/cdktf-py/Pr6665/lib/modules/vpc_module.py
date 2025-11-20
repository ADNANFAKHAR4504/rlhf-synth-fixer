"""VPC module for creating network infrastructure across availability zones."""
from cdktf import TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from typing import List, Dict
from .naming import NamingModule


class VpcModule(Construct):
    """VPC module with public and private subnets across availability zones."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        naming: NamingModule,
        cidr_block: str,
        enable_nat_gateway: bool = True
    ):
        super().__init__(scope, id)

        self.naming = naming

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": naming.generate_simple_name("vpc"),
                "Environment": naming.environment
            }
        )

        # Create Internet Gateway
        self.igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": naming.generate_simple_name("igw"),
                "Environment": naming.environment
            }
        )

        # Calculate subnet CIDR blocks
        vpc_cidr_parts = cidr_block.split('.')
        base_cidr = f"{vpc_cidr_parts[0]}.{vpc_cidr_parts[1]}"

        # Create 3 public subnets
        self.public_subnets: List[Subnet] = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": naming.generate_simple_name(f"public-subnet-{i}"),
                    "Environment": naming.environment,
                    "Type": "Public"
                }
            )
            self.public_subnets.append(subnet)

        # Create 3 private subnets
        self.private_subnets: List[Subnet] = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{i + 10}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    "Name": naming.generate_simple_name(f"private-subnet-{i}"),
                    "Environment": naming.environment,
                    "Type": "Private"
                }
            )
            self.private_subnets.append(subnet)

        # Public route table
        self.public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": naming.generate_simple_name("public-rt"),
                "Environment": naming.environment
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # NAT Gateways and private route tables
        if enable_nat_gateway:
            # Create NAT Gateway in first public subnet
            eip = Eip(
                self,
                "nat_eip",
                domain="vpc",
                tags={
                    "Name": naming.generate_simple_name("nat-eip"),
                    "Environment": naming.environment
                }
            )

            nat_gw = NatGateway(
                self,
                "nat_gateway",
                allocation_id=eip.id,
                subnet_id=self.public_subnets[0].id,
                tags={
                    "Name": naming.generate_simple_name("nat-gw"),
                    "Environment": naming.environment
                }
            )

            # Private route table with NAT Gateway
            private_rt = RouteTable(
                self,
                "private_rt",
                vpc_id=self.vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gw.id
                    )
                ],
                tags={
                    "Name": naming.generate_simple_name("private-rt"),
                    "Environment": naming.environment
                }
            )

            # Associate private subnets with private route table
            for i, subnet in enumerate(self.private_subnets):
                RouteTableAssociation(
                    self,
                    f"private_rt_assoc_{i}",
                    subnet_id=subnet.id,
                    route_table_id=private_rt.id
                )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[subnet.id for subnet in self.public_subnets],
            description="Public subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[subnet.id for subnet in self.private_subnets],
            description="Private subnet IDs"
        )
