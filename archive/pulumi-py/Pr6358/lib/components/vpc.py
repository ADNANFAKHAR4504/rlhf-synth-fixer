"""
VPC Component - Creates VPC with subnets, route tables, IGW, and NAT Gateway
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class VpcComponent(ComponentResource):
    """
    Reusable VPC component with public and private subnets across two AZs
    """

    def __init__(
        self,
        name: str,
        vpc_cidr: str,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:vpc:VpcComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment}-{environment_suffix}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        az_names = azs.names or ['us-east-1a', 'us-east-1b']

        # Create public subnets in two AZs
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{environment}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_cidr.rsplit('.', 2)[0]}.{i}.0/24",
                availability_zone=az_names[i] if isinstance(az_names, list) else pulumi.Output.from_input(az_names).apply(lambda names: names[i]),
                map_public_ip_on_launch=True,
                tags={
                    **tags,
                    "Name": f"public-subnet-{i+1}-{environment}-{environment_suffix}",
                    "Type": "public",
                },
                opts=child_opts,
            )
            self.public_subnets.append(subnet)

        # Create private subnets in two AZs
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_cidr.rsplit('.', 2)[0]}.{i+10}.0/24",
                availability_zone=az_names[i] if isinstance(az_names, list) else pulumi.Output.from_input(az_names).apply(lambda names: names[i]),
                map_public_ip_on_launch=False,
                tags={
                    **tags,
                    "Name": f"private-subnet-{i+1}-{environment}-{environment_suffix}",
                    "Type": "private",
                },
                opts=child_opts,
            )
            self.private_subnets.append(subnet)

        # Allocate Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment}-{environment_suffix}",
            domain="vpc",
            tags={**tags, "Name": f"nat-eip-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment}-{environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, "Name": f"nat-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"public-rt-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Add route to IGW
        self.public_route = aws.ec2.Route(
            f"public-route-{environment}-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=child_opts,
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{environment}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=child_opts,
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"private-rt-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Add route to NAT Gateway
        self.private_route = aws.ec2.Route(
            f"private-route-{environment}-{environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=child_opts,
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=child_opts,
            )

        # Register outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
            }
        )
