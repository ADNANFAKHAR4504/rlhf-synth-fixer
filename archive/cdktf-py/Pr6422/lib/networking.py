"""Networking stack for VPC, subnets, and security groups."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class NetworkingStack(Construct):
    """Networking infrastructure for ECS cluster."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
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
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create public subnets for ALB
        self.public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"${{{azs.fqn}.names[{i}]}}",
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            self.public_subnets.append(subnet)

        # Create private subnets for ECS tasks
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"${{{azs.fqn}.names[{i}]}}",
                tags={
                    "Name": f"payment-private-subnet-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            self.private_subnets.append(subnet)

        # Create Elastic IPs for NAT Gateways
        eips = []
        for i in range(3):
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            eips.append(eip)

        # Create NAT Gateways
        nat_gateways = []
        for i in range(3):
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eips[i].id,
                subnet_id=self.public_subnets[i].id,
                tags={
                    "Name": f"payment-nat-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )
            nat_gateways.append(nat)

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Add route to internet gateway
        Route(
            self,
            "public_route_igw",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # Create route tables for private subnets
        for i, subnet in enumerate(self.private_subnets):
            private_rt = RouteTable(
                self,
                f"private_route_table_{i}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"payment-private-rt-{i}-{environment_suffix}",
                    "Environment": "production",
                    "Team": "payments",
                    "CostCenter": "engineering",
                },
            )

            # Add route to NAT gateway
            Route(
                self,
                f"private_route_nat_{i}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateways[i].id,
            )

            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
            )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def public_subnet_ids(self):
        return [subnet.id for subnet in self.public_subnets]

    @property
    def private_subnet_ids(self):
        return [subnet.id for subnet in self.private_subnets]
