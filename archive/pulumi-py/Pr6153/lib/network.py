"""Network infrastructure components for payment processing system."""
from typing import Dict, List, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class NetworkStack(ComponentResource):
    """ComponentResource for VPC and networking infrastructure."""

    def __init__(
        self,
        name: str,
        vpc_cidr: str,
        environment: str,
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:network:NetworkStack", name, {}, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"payment-vpc-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (2 AZs)
        # Parse VPC CIDR to get base network (e.g., "10.0" from "10.0.0.0/16")
        vpc_base = ".".join(vpc_cidr.split("/")[0].split(".")[:2])

        self.public_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{environment}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_base}.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"payment-public-{environment}-{i}", "Type": "Public"},
                opts=ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{environment}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_base}.{i+10}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={**tags, "Name": f"payment-private-{environment}-{i}", "Type": "Private"},
                opts=ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"payment-igw-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment}",
            domain="vpc",
            tags={**tags, "Name": f"payment-nat-eip-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={**tags, "Name": f"payment-nat-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={**tags, "Name": f"payment-public-rt-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{environment}-{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self),
            )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f"private-rt-{environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id,
                )
            ],
            tags={**tags, "Name": f"payment-private-rt-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{environment}-{i}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self),
            )

        # Create security group for Lambda functions
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{environment}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, "Name": f"payment-lambda-sg-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create security group for RDS
        self.db_sg = aws.ec2.SecurityGroup(
            f"db-sg-{environment}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, "Name": f"payment-db-sg-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]
        self.lambda_security_group_id = self.lambda_sg.id
        self.db_security_group_id = self.db_sg.id

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "lambda_security_group_id": self.lambda_security_group_id,
            "db_security_group_id": self.db_security_group_id,
        })
