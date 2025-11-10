"""
vpc_stack.py

VPC infrastructure component with environment-specific CIDR blocks,
public/private subnets, internet gateway, NAT gateway, and route tables.
"""

from typing import List

import pulumi
from pulumi import Output, ResourceOptions
import pulumi_aws as aws


class VpcStack(pulumi.ComponentResource):
    """
    VPC infrastructure component.

    Creates VPC with environment-specific CIDR, public/private subnets across 2 AZs,
    internet gateway, NAT gateway, and route tables.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        # Environment-specific CIDR blocks
        cidr_blocks = {
            'dev': '10.0.0.0/16',
            'staging': '10.1.0.0/16',
            'prod': '10.2.0.0/16'
        }
        vpc_cidr = cidr_blocks.get(environment_suffix, '10.0.0.0/16')

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'vpc-{environment_suffix}',
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'vpc-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state='available')

        # Extract VPC CIDR base for subnet calculations
        # For 10.0.0.0/16, we want 10.0.X.0/20 subnets
        vpc_base = vpc_cidr.split('/')[0].rsplit('.', 2)[0]  # Gets "10.0"

        # Create public subnets (2 AZs)
        self.public_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'public-subnet-{environment_suffix}-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_base}.{i*16}.0/20',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, 'Name': f'public-subnet-{environment_suffix}-{i+1}', 'Type': 'public'},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'private-subnet-{environment_suffix}-{i+1}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_base}.{(i+2)*16}.0/20',
                availability_zone=azs.names[i],
                tags={**tags, 'Name': f'private-subnet-{environment_suffix}-{i+1}', 'Type': 'private'},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create internet gateway
        self.igw = aws.ec2.InternetGateway(
            f'igw-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Allocate Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f'nat-eip-{environment_suffix}',
            domain='vpc',
            tags={**tags, 'Name': f'nat-eip-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create NAT Gateway in first public subnet
        self.nat = aws.ec2.NatGateway(
            f'nat-{environment_suffix}',
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, 'Name': f'nat-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f'public-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Add route to internet gateway
        aws.ec2.Route(
            f'public-route-{environment_suffix}',
            route_table_id=self.public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{environment_suffix}-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f'private-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'private-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Add route to NAT gateway
        aws.ec2.Route(
            f'private-route-{environment_suffix}',
            route_table_id=self.private_rt.id,
            destination_cidr_block='0.0.0.0/0',
            nat_gateway_id=self.nat.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f'private-rta-{environment_suffix}-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.vpc_cidr = self.vpc.cidr_block
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'vpc_cidr': self.vpc_cidr,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids,
        })
