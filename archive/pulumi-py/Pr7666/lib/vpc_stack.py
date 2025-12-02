"""
VPC Stack for Payment Processing Infrastructure

Creates VPC with 3 availability zones, each with public and private subnets,
NAT Gateways for outbound connectivity, and proper routing tables.
"""

from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class VpcStackArgs:
    """
    Arguments for VPC Stack.

    Args:
        environment_suffix: Suffix for resource naming
        availability_zone_count: Number of availability zones (default: 3)
        vpc_cidr: CIDR block for VPC (default: 10.0.0.0/16)
        tags: Resource tags
    """

    def __init__(
        self,
        environment_suffix: str,
        availability_zone_count: int = 3,
        vpc_cidr: str = "10.0.0.0/16",
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.availability_zone_count = availability_zone_count
        self.vpc_cidr = vpc_cidr
        self.tags = tags or {}


class VpcStack(pulumi.ComponentResource):
    """
    VPC infrastructure with multi-AZ support.

    Creates:
    - VPC with DNS support
    - Internet Gateway
    - 3 availability zones with public and private subnets each
    - NAT Gateways in each public subnet
    - Route tables for public and private subnets
    """

    def __init__(
        self,
        name: str,
        args: VpcStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f'payment-vpc-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'payment-igw-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Get available AZs
        azs = aws.get_availability_zones(state="available")

        # Create subnets for each AZ
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []

        for i in range(args.availability_zone_count):
            az = azs.names[i]

            # Create public subnet
            public_subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f'payment-public-subnet-{i+1}-{args.environment_suffix}',
                    'Type': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Create private subnet
            private_subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **args.tags,
                    'Name': f'payment-private-subnet-{i+1}-{args.environment_suffix}',
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"payment-nat-eip-{i+1}-{args.environment_suffix}",
                domain="vpc",
                tags={
                    **args.tags,
                    'Name': f'payment-nat-eip-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )
            self.eips.append(eip)

            # Create NAT Gateway in public subnet
            nat_gateway = aws.ec2.NatGateway(
                f"payment-nat-{i+1}-{args.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **args.tags,
                    'Name': f'payment-nat-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self, depends_on=[eip])
            )
            self.nat_gateways.append(nat_gateway)

        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'payment-public-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Route public traffic to Internet Gateway
        aws.ec2.Route(
            f"payment-public-route-{args.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create separate route table for each private subnet (for NAT Gateway)
        self.private_route_tables = []
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"payment-private-rt-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    **args.tags,
                    'Name': f'payment-private-rt-{i+1}-{args.environment_suffix}'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_route_tables.append(private_rt)

            # Route private traffic to NAT Gateway
            aws.ec2.Route(
                f"payment-private-route-{i+1}-{args.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Export outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids,
        })
