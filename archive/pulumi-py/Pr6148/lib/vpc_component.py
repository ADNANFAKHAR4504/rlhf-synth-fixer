import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class VpcComponent(ComponentResource):
    """
    Reusable VPC component with public and private subnets across multiple AZs
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        cidr_block: str,
        availability_zones: list,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:network:VpcComponent", name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"public-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**tags, "Name": f"private-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)

        # Create NAT Gateway (single for cost optimization)
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment_suffix}",
            domain="vpc",
            tags={**tags, "Name": f"nat-eip-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, "Name": f"nat-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"public-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Public route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self),
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self),
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"private-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Private route to NAT Gateway
        aws.ec2.Route(
            f"private-route-{environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self),
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self),
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]

        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
            }
        )
