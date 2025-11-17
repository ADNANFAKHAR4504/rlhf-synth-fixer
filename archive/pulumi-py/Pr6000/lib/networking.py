"""
networking.py

VPC and networking infrastructure for multi-environment deployment.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional


class NetworkingStack(pulumi.ComponentResource):
    """
    Creates VPC infrastructure with public and private subnets across multiple AZs.
    """

    def __init__(
        self,
        name: str,
        *,
        vpc_cidr: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f'vpc-{environment_suffix}',
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'vpc-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f'igw-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state='available')

        # Extract base CIDR for subnet calculation (e.g., "10.0" from "10.0.0.0/16")
        vpc_cidr_base = '.'.join(vpc_cidr.split('.')[:2])

        # Create public subnets
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'public-subnet-{i}-{environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr_base}.{i}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, 'Name': f'public-subnet-{i}-{environment_suffix}', 'Type': 'public'},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f'private-subnet-{i}-{environment_suffix}',
                vpc_id=self.vpc.id,
                cidr_block=f'{vpc_cidr_base}.{i+10}.0/24',
                availability_zone=azs.names[i],
                tags={**tags, 'Name': f'private-subnet-{i}-{environment_suffix}', 'Type': 'private'},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f'public-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
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
                f'public-rta-{i}-{environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table (no NAT Gateway for cost optimization)
        self.private_rt = aws.ec2.RouteTable(
            f'private-rt-{environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**tags, 'Name': f'private-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f'private-rta-{i}-{environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Expose outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids
        })
