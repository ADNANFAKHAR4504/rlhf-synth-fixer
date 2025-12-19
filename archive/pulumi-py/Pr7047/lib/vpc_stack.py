"""
vpc_stack.py

VPC infrastructure with public and private subnets for cost-optimized ECS deployment.
Uses 2 AZs for high availability while minimizing data transfer costs.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class VpcStack(pulumi.ComponentResource):
    """
    VPC stack with public and private subnets across 2 availability zones.

    Cost optimizations:
    - 2 AZs (vs 3) for cost savings while maintaining HA
    - Private subnets for ECS tasks (no NAT Gateway charges for ALB communication)
    - Minimal CIDR ranges to reduce IP waste

    Args:
        name (str): Resource name
        environment_suffix (str): Environment identifier
        opts (ResourceOptions): Pulumi options
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VpcStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}",
                "Environment": environment_suffix,
                "CostCenter": "payment-processing"
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones (use only 2 for cost optimization)
        azs = aws.get_availability_zones(state="available")

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets (for ALB)
        self.public_subnets = []
        self.public_subnet_ids = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Tier": "public"
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
            self.public_subnet_ids.append(subnet.id)

        # Create private subnets (for ECS tasks)
        self.private_subnets = []
        self.private_subnet_ids = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=azs.names[i],
                tags={
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Tier": "private"
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"public-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Public route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Create NAT Gateway for private subnets
        # Note: Using single NAT Gateway for cost optimization
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment_suffix}",
            domain="vpc",
            tags={
                "Name": f"nat-eip-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-gateway-{environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={
                "Name": f"nat-gateway-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"private-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Private route to NAT Gateway
        aws.ec2.Route(
            f"private-route-{environment_suffix}",
            route_table_id=self.private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self)
            )

        self.register_outputs({})
