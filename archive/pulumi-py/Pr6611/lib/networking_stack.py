"""
Networking infrastructure module for secure AWS foundation.

This module creates:
- VPC with CIDR 10.0.0.0/16
- 3 private subnets across 3 availability zones
- NAT instances (Amazon Linux 2) in each AZ
- Route tables for outbound internet access
- Security groups for NAT instances
"""

from typing import List, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class NetworkingStackArgs:
    """Arguments for NetworkingStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_cidr: str = "10.0.0.0/16",
        private_subnet_cidrs: Optional[List[str]] = None,
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.private_subnet_cidrs = private_subnet_cidrs or [
            "10.0.1.0/24",
            "10.0.2.0/24",
            "10.0.3.0/24"
        ]
        self.region = region


class NetworkingStack(pulumi.ComponentResource):
    """
    NetworkingStack component creates VPC infrastructure with private subnets and NAT instances.

    Exports:
        vpc_id: VPC identifier
        private_subnet_ids: List of private subnet IDs
        nat_instance_ips: List of NAT instance Elastic IPs
    """

    def __init__(
        self,
        name: str,
        args: NetworkingStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block=args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.internet_gateway = aws.ec2.InternetGateway(
            f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Get availability zones - use explicit list for reliability
        # Different regions have different AZ counts, so we map explicitly
        az_map = {
            "us-east-1": ["us-east-1a", "us-east-1b", "us-east-1c"],
            "us-east-2": ["us-east-2a", "us-east-2b", "us-east-2c"],
            "us-west-1": ["us-west-1a", "us-west-1b", "us-west-1c"],
            "us-west-2": ["us-west-2a", "us-west-2b", "us-west-2c"],
            "eu-west-1": ["eu-west-1a", "eu-west-1b", "eu-west-1c"],
            "eu-central-1": ["eu-central-1a", "eu-central-1b", "eu-central-1c"],
            "ap-south-1": ["ap-south-1a", "ap-south-1b", "ap-south-1c"],
            "ap-southeast-1": ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
        }

        # Get AZs for the specified region, default to us-east-2
        available_azs = az_map.get(args.region, ["us-east-2a", "us-east-2b", "us-east-2c"])

        # Create public subnets for NAT instances
        self.public_subnets: List[aws.ec2.Subnet] = []
        public_subnet_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

        for i, cidr in enumerate(public_subnet_cidrs):
            az_index = i % len(available_azs)

            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=available_azs[az_index],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform",
                    "Type": "public"
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(public_subnet)

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"public-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create route to internet gateway
        aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(parent=self.public_route_table, depends_on=[self.internet_gateway])
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self.public_route_table)
            )

        # Create private subnets
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i, cidr in enumerate(args.private_subnet_cidrs):
            # Use modulo to safely wrap around available AZs
            az_index = i % len(available_azs)

            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=available_azs[az_index],
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform",
                    "Type": "private"
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Get latest Amazon Linux 2 AMI for NAT instances
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
                aws.ec2.GetAmiFilterArgs(name="state", values=["available"])
            ]
        )

        # Create security group for NAT instances
        self.nat_security_group = aws.ec2.SecurityGroup(
            f"nat-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for NAT instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=[args.vpc_cidr],
                    description="Allow all traffic from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"nat-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create NAT instances and route tables
        self.nat_instances: List[aws.ec2.Instance] = []
        self.nat_eips: List[aws.ec2.Eip] = []
        self.route_tables: List[aws.ec2.RouteTable] = []

        for i, private_subnet in enumerate(self.private_subnets):
            # Get corresponding public subnet for NAT instance placement
            public_subnet = self.public_subnets[i % len(self.public_subnets)]

            # Create Elastic IP for NAT instance (requires IGW to be attached)
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"nat-eip-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=self.internet_gateway, depends_on=[self.internet_gateway])
            )
            self.nat_eips.append(eip)

            # Create NAT instance in public subnet
            nat_instance = aws.ec2.Instance(
                f"nat-instance-{i+1}-{self.environment_suffix}",
                instance_type="t3.micro",
                ami=ami.id,
                subnet_id=public_subnet.id,
                vpc_security_group_ids=[self.nat_security_group.id],
                source_dest_check=False,
                user_data="""#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
yum install -y iptables-services
service iptables save
""",
                tags={
                    "Name": f"nat-instance-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=public_subnet)
            )
            self.nat_instances.append(nat_instance)

            # Associate Elastic IP with NAT instance (requires IGW)
            aws.ec2.EipAssociation(
                f"nat-eip-assoc-{i+1}-{self.environment_suffix}",
                instance_id=nat_instance.id,
                allocation_id=eip.id,
                opts=ResourceOptions(parent=nat_instance, depends_on=[self.internet_gateway, nat_instance, eip])
            )

            # Create route table for private subnet
            route_table = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"private-rt-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=nat_instance)
            )
            self.route_tables.append(route_table)

            # Create route to internet through NAT instance
            # Use the NAT instance's primary network interface
            aws.ec2.Route(
                f"private-route-{i+1}-{self.environment_suffix}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                network_interface_id=nat_instance.primary_network_interface_id,
                opts=ResourceOptions(parent=route_table)
            )

            # Associate route table with subnet
            aws.ec2.RouteTableAssociation(
                f"private-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table, depends_on=[route_table])
            )

        # Register outputs
        self.vpc_id = self.vpc.id
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]
        self.nat_instance_ips = [eip.public_ip for eip in self.nat_eips]

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "private_subnet_ids": self.private_subnet_ids,
            "nat_instance_ips": self.nat_instance_ips
        })
