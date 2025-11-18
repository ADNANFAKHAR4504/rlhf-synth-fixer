"""
Networking infrastructure module.
Creates VPC with 3 availability zones.
"""
from typing import List, Dict, Any
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class NetworkingStack:
    """Creates VPC and networking resources."""

    def __init__(self, name: str, environment_suffix: str, tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize networking infrastructure.

        Args:
            name: Resource name prefix
            environment_suffix: Environment suffix for resource naming
            tags: Common tags to apply
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment_suffix}"},
            opts=opts
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (3 AZs)
        self.public_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"public-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (3 AZs)
        self.private_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**tags, "Name": f"private-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={**tags, "Name": f"public-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=subnet)
            )

        # Security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"alb-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for EC2 instances
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"ec2-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"ec2-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.ec2_sg.id]
                )
            ],
            tags={**tags, "Name": f"rds-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )
