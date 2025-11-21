"""
VPC Component for Payment Processing Infrastructure.
Creates isolated VPC with public and private subnets.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class VpcComponentArgs:
    """Arguments for VPC Component."""

    def __init__(
        self,
        environment_suffix: str,
        cidr_block: str = "10.0.0.0/16",
        availability_zones: list = None,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.cidr_block = cidr_block
        self.availability_zones = availability_zones or ["us-east-1a", "us-east-1b"]
        self.tags = tags or {}


class VpcComponent(pulumi.ComponentResource):
    """
    Reusable VPC component with isolated network configuration.
    Creates VPC with 2 public and 2 private subnets, IGW, and NAT Gateway.
    """

    def __init__(
        self,
        name: str,
        args: VpcComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:network:VpcComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f"payment-vpc-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-igw-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(args.availability_zones[:2]):
            subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f"payment-public-subnet-{i+1}-{args.environment_suffix}",
                    'Type': 'public',
                },
                opts=child_opts
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(args.availability_zones[:2]):
            subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **args.tags,
                    'Name': f"payment-private-subnet-{i+1}-{args.environment_suffix}",
                    'Type': 'private',
                },
                opts=child_opts
            )
            self.private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"payment-nat-eip-{args.environment_suffix}",
            domain="vpc",
            tags={
                **args.tags,
                'Name': f"payment-nat-eip-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"payment-nat-{args.environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={
                **args.tags,
                'Name': f"payment-nat-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-public-rt-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create route to Internet Gateway
        aws.ec2.Route(
            f"payment-public-route-{args.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=child_opts
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=child_opts
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"payment-private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f"payment-private-rt-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Create route to NAT Gateway
        aws.ec2.Route(
            f"payment-private-route-{args.environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=child_opts
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=child_opts
            )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': [s.id for s in self.public_subnets],
            'private_subnet_ids': [s.id for s in self.private_subnets],
            'nat_gateway_id': self.nat_gateway.id,
        })
