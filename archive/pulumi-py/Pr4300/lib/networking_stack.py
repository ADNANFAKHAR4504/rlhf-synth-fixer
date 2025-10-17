"""
networking_stack.py

Multi-region networking infrastructure with VPCs, subnets, and Route53 health checks.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class NetworkingStack(pulumi.ComponentResource):
    """
    Creates multi-region networking infrastructure for DR.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        # Create VPC in primary region
        self.primary_vpc = aws.ec2.Vpc(
            f"primary-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'primary-vpc-{environment_suffix}', 'Region': primary_region},
            opts=ResourceOptions(parent=self)
        )

        # Create VPC in secondary region
        secondary_provider = aws.Provider(
            f"secondary-provider-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        self.secondary_vpc = aws.ec2.Vpc(
            f"secondary-vpc-{environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, 'Name': f'secondary-vpc-{environment_suffix}', 'Region': secondary_region},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create public subnets in primary region
        self.primary_public_subnet_1 = aws.ec2.Subnet(
            f"primary-public-subnet-1-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{primary_region}a",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'primary-public-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.primary_public_subnet_2 = aws.ec2.Subnet(
            f"primary-public-subnet-2-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{primary_region}b",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'primary-public-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets in primary region
        self.primary_private_subnet_1 = aws.ec2.Subnet(
            f"primary-private-subnet-1-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{primary_region}a",
            tags={**tags, 'Name': f'primary-private-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.primary_private_subnet_2 = aws.ec2.Subnet(
            f"primary-private-subnet-2-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{primary_region}b",
            tags={**tags, 'Name': f'primary-private-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets in secondary region
        self.secondary_public_subnet_1 = aws.ec2.Subnet(
            f"secondary-public-subnet-1-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.1.0/24",
            availability_zone=f"{secondary_region}a",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'secondary-public-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_public_subnet_2 = aws.ec2.Subnet(
            f"secondary-public-subnet-2-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.2.0/24",
            availability_zone=f"{secondary_region}b",
            map_public_ip_on_launch=True,
            tags={**tags, 'Name': f'secondary-public-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create private subnets in secondary region
        self.secondary_private_subnet_1 = aws.ec2.Subnet(
            f"secondary-private-subnet-1-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.11.0/24",
            availability_zone=f"{secondary_region}a",
            tags={**tags, 'Name': f'secondary-private-1-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_private_subnet_2 = aws.ec2.Subnet(
            f"secondary-private-subnet-2-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            cidr_block="10.1.12.0/24",
            availability_zone=f"{secondary_region}b",
            tags={**tags, 'Name': f'secondary-private-2-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Internet Gateways
        self.primary_igw = aws.ec2.InternetGateway(
            f"primary-igw-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            tags={**tags, 'Name': f'primary-igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_igw = aws.ec2.InternetGateway(
            f"secondary-igw-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            tags={**tags, 'Name': f'secondary-igw-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Route tables
        self.primary_public_rt = aws.ec2.RouteTable(
            f"primary-public-rt-{environment_suffix}",
            vpc_id=self.primary_vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.primary_igw.id,
                )
            ],
            tags={**tags, 'Name': f'primary-public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.secondary_public_rt = aws.ec2.RouteTable(
            f"secondary-public-rt-{environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.secondary_igw.id,
                )
            ],
            tags={**tags, 'Name': f'secondary-public-rt-{environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Route table associations
        aws.ec2.RouteTableAssociation(
            f"primary-public-rta-1-{environment_suffix}",
            subnet_id=self.primary_public_subnet_1.id,
            route_table_id=self.primary_public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"primary-public-rta-2-{environment_suffix}",
            subnet_id=self.primary_public_subnet_2.id,
            route_table_id=self.primary_public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"secondary-public-rta-1-{environment_suffix}",
            subnet_id=self.secondary_public_subnet_1.id,
            route_table_id=self.secondary_public_rt.id,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        aws.ec2.RouteTableAssociation(
            f"secondary-public-rta-2-{environment_suffix}",
            subnet_id=self.secondary_public_subnet_2.id,
            route_table_id=self.secondary_public_rt.id,
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Create Route53 hosted zone
        self.hosted_zone = aws.route53.Zone(
            f"ecommerce-zone-{environment_suffix}",
            name=f"ecommerce-{environment_suffix}.internal",
            tags={**tags, 'Name': f'ecommerce-zone-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Expose outputs
        self.primary_vpc_id = self.primary_vpc.id
        self.secondary_vpc_id = self.secondary_vpc.id
        self.primary_public_subnet_ids = [self.primary_public_subnet_1.id, self.primary_public_subnet_2.id]
        self.secondary_public_subnet_ids = [self.secondary_public_subnet_1.id, self.secondary_public_subnet_2.id]
        self.primary_private_subnet_ids = [self.primary_private_subnet_1.id, self.primary_private_subnet_2.id]
        self.secondary_private_subnet_ids = [self.secondary_private_subnet_1.id, self.secondary_private_subnet_2.id]
        self.hosted_zone_id = self.hosted_zone.id
        self.primary_endpoint = Output.concat("primary.", self.hosted_zone.name)

        self.register_outputs({})
