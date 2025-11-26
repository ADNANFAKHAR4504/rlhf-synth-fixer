"""VPC Stack - Network infrastructure with 6 subnets across 3 AZs."""

from typing import Dict, List, Any
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route


class VpcConstruct(Construct):
    """VPC Construct with 3 public and 3 private subnets across 3 AZs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        **kwargs: Any
    ) -> None:
        """Initialize VPC construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            aws_region: AWS region for deployment
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # Create VPC
        self.vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Availability zones
        azs: List[str] = [
            f"{aws_region}a",
            f"{aws_region}b",
            f"{aws_region}c"
        ]

        # Create Internet Gateway
        self.igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create public subnets
        self.public_subnets: List[Subnet] = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Tier": "public"
                }
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets: List[Subnet] = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Tier": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_route_table = RouteTable(
            self,
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Add route to Internet Gateway
        Route(
            self,
            f"public-route-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Create NAT Gateways (one per public subnet for HA)
        self.nat_gateways: List[NatGateway] = []
        for i, subnet in enumerate(self.public_subnets):
            eip = Eip(
                self,
                f"nat-eip-{i+1}-{environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )

            nat_gw = NatGateway(
                self,
                f"nat-gw-{i+1}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"payment-nat-gw-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )
            self.nat_gateways.append(nat_gw)

        # Create private route tables (one per AZ)
        self.private_route_tables: List[RouteTable] = []
        for i, nat_gw in enumerate(self.nat_gateways):
            rt = RouteTable(
                self,
                f"private-rt-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"payment-private-rt-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )

            Route(
                self,
                f"private-route-{i+1}-{environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )

            self.private_route_tables.append(rt)

        # Associate private subnets with private route tables
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_tables[i].id
            )

    def get_vpc_id(self) -> str:
        """Get VPC ID."""
        return self.vpc.id

    def get_public_subnet_ids(self) -> List[str]:
        """Get list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    def get_private_subnet_ids(self) -> List[str]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
