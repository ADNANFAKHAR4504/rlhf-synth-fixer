"""
Networking Stack - VPC, Subnets, NAT Gateways, Security Groups
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws


class NetworkingStackArgs:
    """Arguments for NetworkingStack"""

    def __init__(
        self,
        environment_suffix: str,
        vpc_cidr: str = "10.0.0.0/16",
        azs: List[str] = None,
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.azs = azs or ["eu-west-2a", "eu-west-2b", "eu-west-2c"]
        self.tags = tags or {}


class NetworkingStack(pulumi.ComponentResource):
    """
    Networking infrastructure for loan processing application.
    Creates VPC, subnets, NAT Gateways, and security groups.
    """

    def __init__(
        self,
        name: str,
        args: NetworkingStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:networking:NetworkingStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"loan-vpc-{self.environment_suffix}",
            cidr_block=args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"loan-vpc-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )
        self.vpc_id = self.vpc.id

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"loan-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"loan-igw-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create public and private subnets across AZs
        self.public_subnets = []
        self.private_subnets = []
        self.database_subnets = []

        for idx, az in enumerate(args.azs):
            # Public subnet for ALB
            public_subnet = aws.ec2.Subnet(
                f"loan-public-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"loan-public-subnet-{idx}-{self.environment_suffix}", "Type": "Public"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Private subnet for ECS tasks
            private_subnet = aws.ec2.Subnet(
                f"loan-private-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10 + idx}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"loan-private-subnet-{idx}-{self.environment_suffix}", "Type": "Private"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

            # Database subnet for RDS
            db_subnet = aws.ec2.Subnet(
                f"loan-db-subnet-{idx}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{20 + idx}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"loan-db-subnet-{idx}-{self.environment_suffix}", "Type": "Database"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.database_subnets.append(db_subnet)

        # Create Elastic IP for NAT Gateway (single NAT for cost optimization)
        self.nat_eip = aws.ec2.Eip(
            f"loan-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**self.tags, "Name": f"loan-nat-eip-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.igw])
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"loan-nat-{self.environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.nat_eip.id,
            tags={**self.tags, "Name": f"loan-nat-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.igw])
        )

        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"loan-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"loan-public-rt-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"loan-public-route-{self.environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for idx, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"loan-public-rta-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Private route table
        self.private_rt = aws.ec2.RouteTable(
            f"loan-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"loan-private-rt-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"loan-private-route-{self.environment_suffix}",
            route_table_id=self.private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate private and database subnets with private route table
        for idx, subnet in enumerate(self.private_subnets + self.database_subnets):
            aws.ec2.RouteTableAssociation(
                f"loan-private-rta-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Security Groups

        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"loan-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
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
            tags={**self.tags, "Name": f"loan-alb-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # ECS Security Group
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"loan-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_sg.id],
                    description="Allow traffic from ALB"
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
            tags={**self.tags, "Name": f"loan-ecs-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.alb_sg])
        )

        # RDS Security Group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"loan-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.ecs_sg.id],
                    description="Allow MySQL traffic from ECS"
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
            tags={**self.tags, "Name": f"loan-rds-sg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.ecs_sg])
        )

        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": [s.id for s in self.public_subnets],
            "private_subnet_ids": [s.id for s in self.private_subnets],
            "database_subnet_ids": [s.id for s in self.database_subnets],
            "alb_sg_id": self.alb_sg.id,
            "ecs_sg_id": self.ecs_sg.id,
            "rds_sg_id": self.rds_sg.id
        })
