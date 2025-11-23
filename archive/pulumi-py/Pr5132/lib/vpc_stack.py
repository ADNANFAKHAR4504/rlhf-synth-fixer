"""
vpc_stack.py

VPC stack with public/private subnets and NAT Gateway
Provides network isolation for ECS tasks in private subnets
"""

from typing import Optional, List

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class VPCStackArgs:
    """Arguments for VPC stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        cidr_block: str = '10.0.0.0/16'
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.cidr_block = cidr_block


class VPCStack(pulumi.ComponentResource):
    """
    VPC stack with public and private subnets across multiple AZs
    Includes NAT Gateway for outbound internet access from private subnets
    """

    def __init__(
        self,
        name: str,
        args: VPCStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VPCStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f'vpc-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'igw-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones for eu-west-1
        azs = aws.get_availability_zones(state='available')

        # Create public subnets (2 AZs)
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f'public-subnet-{i}-{args.environment_suffix}',
                    'Type': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={
                    **args.tags,
                    'Name': f'private-subnet-{i}-{args.environment_suffix}',
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{args.environment_suffix}",
            domain='vpc',
            tags={
                **args.tags,
                'Name': f'nat-eip-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{args.environment_suffix}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                **args.tags,
                'Name': f'nat-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.igw])
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    gateway_id=self.igw.id
                )
            ],
            tags={
                **args.tags,
                'Name': f'public-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={
                **args.tags,
                'Name': f'private-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids
        })
