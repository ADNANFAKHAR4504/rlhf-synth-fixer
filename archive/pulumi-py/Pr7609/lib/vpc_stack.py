"""
vpc_stack.py

VPC infrastructure for transaction monitoring system.
Creates VPC with public and private subnets across multiple AZs.
"""

from typing import List, Optional, Dict
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import ec2


class VpcStack(pulumi.ComponentResource):
    """
    VPC stack with public and private subnets for Multi-AZ deployment.

    Creates:
    - VPC with DNS support
    - Internet Gateway
    - Public subnets in multiple AZs
    - Private subnets in multiple AZs
    - Route tables and associations
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        azs: List[str],
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        resource_tags = tags or {}

        # Create VPC
        self.vpc = ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **resource_tags,
                'Name': f"vpc-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f"igw-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(azs):
            subnet = ec2.Subnet(
                f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **resource_tags,
                    'Name': f"public-subnet-{i+1}-{environment_suffix}",
                    'Type': 'Public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(azs):
            subnet = ec2.Subnet(
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **resource_tags,
                    'Name': f"private-subnet-{i+1}-{environment_suffix}",
                    'Type': 'Private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create public route table
        self.public_rt = ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f"public-rt-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table
        self.private_rt = ec2.RouteTable(
            f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **resource_tags,
                'Name': f"private-rt-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Export values
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids
        })
