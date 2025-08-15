"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Dict, Optional
import pulumi
from pulumi import ResourceOptions, Config
from pulumi_aws import ec2, get_availability_zones


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific
    components and manages the environment suffix used for naming and
    configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment
            suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Get configuration
        config = Config()
        team = config.get('team') or 'platform'
        project = config.get('project') or 'tap'

        # Base tags for all resources
        base_tags = {
            'Environment': self.environment_suffix,
            'Team': team,
            'Project': project,
            **self.tags
        }

        # Get availability zones
        azs = get_availability_zones(state="available")
        az_names = azs.names[:2]  # Use first 2 AZs

        # Create VPC
        vpc = ec2.Vpc(
            f"tap-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"tap-vpc-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = ec2.InternetGateway(
            f"tap-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"tap-igw-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets
        public_subnets = []
        for i, az in enumerate(az_names):
            subnet = ec2.Subnet(
                f"tap-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"tap-public-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Public",
                    **base_tags
                },
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)

        # Create private subnets
        private_subnets = []
        for i, az in enumerate(az_names):
            subnet = ec2.Subnet(
                f"tap-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"tap-private-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Private",
                    **base_tags
                },
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        eip = ec2.Eip(
            f"tap-nat-eip-{self.environment_suffix}",
            vpc=True,
            tags={
                "Name": f"tap-nat-eip-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create NAT Gateway
        nat_gateway = ec2.NatGateway(
            f"tap-nat-gateway-{self.environment_suffix}",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={
                "Name": f"tap-nat-gateway-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route table for public subnets
        public_route_table = ec2.RouteTable(
            f"tap-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": igw.id
            }],
            tags={
                "Name": f"tap-public-rt-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route table for private subnets
        private_route_table = ec2.RouteTable(
            f"tap-private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[{
                "cidr_block": "0.0.0.0/0",
                "nat_gateway_id": nat_gateway.id
            }],
            tags={
                "Name": f"tap-private-rt-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        public_route_table_associations = []
        for i, subnet in enumerate(public_subnets):
            association = ec2.RouteTableAssociation(
                f"tap-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id,
                opts=ResourceOptions(parent=self)
            )
            public_route_table_associations.append(association)

        # Associate private subnets with private route table
        private_route_table_associations = []
        for i, subnet in enumerate(private_subnets):
            association = ec2.RouteTableAssociation(
                f"tap-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_route_table.id,
                opts=ResourceOptions(parent=self)
            )
            private_route_table_associations.append(association)

        # Create security group for public resources
        public_sg = ec2.SecurityGroup(
            f"tap-public-sg-{self.environment_suffix}",
            description="Security group for public resources",
            vpc_id=vpc.id,
            ingress=[{
                "protocol": "tcp",
                "from_port": 80,
                "to_port": 80,
                "cidr_blocks": ["0.0.0.0/0"]
            }, {
                "protocol": "tcp",
                "from_port": 443,
                "to_port": 443,
                "cidr_blocks": ["0.0.0.0/0"]
            }, {
                "protocol": "tcp",
                "from_port": 22,
                "to_port": 22,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"tap-public-sg-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for private resources
        private_sg = ec2.SecurityGroup(
            f"tap-private-sg-{self.environment_suffix}",
            description="Security group for private resources",
            vpc_id=vpc.id,
            ingress=[{
                "protocol": "tcp",
                "from_port": 22,
                "to_port": 22,
                "security_groups": [public_sg.id]
            }],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"tap-private-sg-{self.environment_suffix}",
                **base_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Store references to created resources
        self.vpc = vpc
        self.public_subnets = public_subnets
        self.private_subnets = private_subnets
        self.public_sg = public_sg
        self.private_sg = private_sg
        self.igw = igw
        self.nat_gateway = nat_gateway

        # Register outputs
        self.register_outputs({
            "vpc_id": vpc.id,
            "vpc_cidr": vpc.cidr_block,
            "public_subnet_ids": [subnet.id for subnet in public_subnets],
            "private_subnet_ids": [subnet.id for subnet in private_subnets],
            "public_security_group_id": public_sg.id,
            "private_security_group_id": private_sg.id,
            "internet_gateway_id": igw.id,
            "nat_gateway_id": nat_gateway.id,
            "availability_zones": az_names
        })
