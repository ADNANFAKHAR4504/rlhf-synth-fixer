"""
vpc_stack.py

VPC and networking infrastructure for the GlobeCart platform.
Creates a multi-AZ VPC with public and private subnets.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class VpcStack(pulumi.ComponentResource):
    """
    Creates VPC infrastructure with multi-AZ support.
    """

    def __init__(
        self,
        name: str,
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:vpc:VpcStack', name, None, opts)

        self.tags = tags or {}
        child_opts = ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'{name}-vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, 'Name': f'{name}-vpc'},
            opts=child_opts
        )

        # Get availability zones
        azs = aws.get_availability_zones(state='available')

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f'{name}-igw',
            vpc_id=self.vpc.id,
            tags={**self.tags, 'Name': f'{name}-igw'},
            opts=child_opts
        )

        # Create public subnets (2 AZs)
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'{name}-public-subnet-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.tags, 'Name': f'{name}-public-subnet-{i+1}', 'Type': 'Public'},
                opts=child_opts
            )
            self.public_subnets.append(subnet)

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f'{name}-public-rt',
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id
            )],
            tags={**self.tags, 'Name': f'{name}-public-rt'},
            opts=child_opts
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'{name}-public-rt-assoc-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=child_opts
            )

        # Create Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(2):
            eip = aws.ec2.Eip(
                f'{name}-nat-eip-{i+1}',
                domain='vpc',
                tags={**self.tags, 'Name': f'{name}-nat-eip-{i+1}'},
                opts=child_opts
            )
            self.eips.append(eip)

        # Create NAT Gateways in public subnets
        self.nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.eips)):
            nat = aws.ec2.NatGateway(
                f'{name}-nat-{i+1}',
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={**self.tags, 'Name': f'{name}-nat-{i+1}'},
                opts=child_opts
            )
            self.nat_gateways.append(nat)

        # Create private subnets (2 AZs)
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'{name}-private-subnet-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=azs.names[i],
                tags={**self.tags, 'Name': f'{name}-private-subnet-{i+1}', 'Type': 'Private'},
                opts=child_opts
            )
            self.private_subnets.append(subnet)

        # Create private route tables (one per AZ for HA)
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f'{name}-private-rt-{i+1}',
                vpc_id=self.vpc.id,
                routes=[aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    nat_gateway_id=nat.id
                )],
                tags={**self.tags, 'Name': f'{name}-private-rt-{i+1}'},
                opts=child_opts
            )

            aws.ec2.RouteTableAssociation(
                f'{name}-private-rt-assoc-{i+1}',
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=child_opts
            )

        # Store outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids,
        })
