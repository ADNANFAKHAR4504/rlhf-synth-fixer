"""
network_stack.py

Network infrastructure module for the migration project.
Creates VPCs, subnets, Transit Gateway, and related networking resources.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class NetworkStackArgs:
    """Arguments for NetworkStack component."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str = "ap-southeast-1",
        secondary_region: str = "us-east-1",
        tertiary_region: str = "us-east-2",
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.tertiary_region = tertiary_region
        self.tags = tags or {}


class NetworkStack(pulumi.ComponentResource):
    """
    Network infrastructure for migration project.

    Creates:
    - Dual VPCs (production and migration) in primary region
    - VPCs in secondary and tertiary regions
    - Transit Gateway for connectivity
    - Public and private subnets across multiple AZs
    - NAT Gateways for private subnet internet access
    - DMS-specific subnets
    """

    def __init__(
        self,
        name: str,
        args: NetworkStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:network:NetworkStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Network'
        }

        self._provider = opts.provider if opts and opts.provider else None
        invoke_opts = pulumi.InvokeOptions(parent=self, provider=self._provider)

        # Create production VPC in primary region
        self.production_vpc = aws.ec2.Vpc(
            f"production-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                'Name': f"production-vpc-{self.environment_suffix}",
                'VPCType': 'Production'
            },
            opts=ResourceOptions(parent=self, provider=self._provider)
        )

        # Create migration VPC in primary region
        self.migration_vpc = aws.ec2.Vpc(
            f"migration-vpc-{self.environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                'Name': f"migration-vpc-{self.environment_suffix}",
                'VPCType': 'Migration'
            },
            opts=ResourceOptions(parent=self, provider=self._provider)
        )

        # Get availability zones for primary region
        azs = aws.get_availability_zones(state="available", opts=invoke_opts)

        # Ensure we have availability zones
        az_names = azs.names if azs.names else ["us-east-1a", "us-east-1b", "us-east-1c"]
        num_azs = min(3, len(az_names))

        # Create subnets for production VPC
        self.production_public_subnets = []
        self.production_private_subnets = []
        self.production_dms_subnets = []

        for i in range(num_azs):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"production-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.production_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az_names[i],
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    'Name': f"production-public-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Public'
                },
                opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
            )
            self.production_public_subnets.append(public_subnet)

            # Private subnet for compute
            private_subnet = aws.ec2.Subnet(
                f"production-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.production_vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az_names[i],
                tags={
                    **self.tags,
                    'Name': f"production-private-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Private'
                },
                opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
            )
            self.production_private_subnets.append(private_subnet)

            # DMS subnet
            dms_subnet = aws.ec2.Subnet(
                f"production-dms-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.production_vpc.id,
                cidr_block=f"10.0.{20+i}.0/24",
                availability_zone=az_names[i],
                tags={
                    **self.tags,
                    'Name': f"production-dms-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'DMS'
                },
                opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
            )
            self.production_dms_subnets.append(dms_subnet)

        # Create subnets for migration VPC
        self.migration_public_subnets = []
        self.migration_private_subnets = []
        self.migration_dms_subnets = []

        for i in range(num_azs):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"migration-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.migration_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az_names[i],
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    'Name': f"migration-public-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Public'
                },
                opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
            )
            self.migration_public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"migration-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.migration_vpc.id,
                cidr_block=f"10.1.{10+i}.0/24",
                availability_zone=az_names[i],
                tags={
                    **self.tags,
                    'Name': f"migration-private-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'Private'
                },
                opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
            )
            self.migration_private_subnets.append(private_subnet)

            # DMS subnet
            dms_subnet = aws.ec2.Subnet(
                f"migration-dms-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.migration_vpc.id,
                cidr_block=f"10.1.{20+i}.0/24",
                availability_zone=az_names[i],
                tags={
                    **self.tags,
                    'Name': f"migration-dms-subnet-{i+1}-{self.environment_suffix}",
                    'Type': 'DMS'
                },
                opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
            )
            self.migration_dms_subnets.append(dms_subnet)

        # Internet Gateways
        self.production_igw = aws.ec2.InternetGateway(
            f"production-igw-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            tags={
                **self.tags,
                'Name': f"production-igw-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        self.migration_igw = aws.ec2.InternetGateway(
            f"migration-igw-{self.environment_suffix}",
            vpc_id=self.migration_vpc.id,
            tags={
                **self.tags,
                'Name': f"migration-igw-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
        )

        # Elastic IPs and NAT Gateways for production VPC
        self.production_nat_gateways = []
        for i, public_subnet in enumerate(self.production_public_subnets[:1]):  # Single NAT for cost
            eip = aws.ec2.Eip(
                f"production-nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    **self.tags,
                    'Name': f"production-nat-eip-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=self._provider)
            )

            nat_gw = aws.ec2.NatGateway(
                f"production-nat-gw-{i+1}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.tags,
                    'Name': f"production-nat-gw-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self.production_vpc, depends_on=[self.production_igw], provider=self._provider)
            )
            self.production_nat_gateways.append(nat_gw)

        # NAT Gateways for migration VPC
        self.migration_nat_gateways = []
        for i, public_subnet in enumerate(self.migration_public_subnets[:1]):  # Single NAT for cost
            eip = aws.ec2.Eip(
                f"migration-nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    **self.tags,
                    'Name': f"migration-nat-eip-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=self._provider)
            )

            nat_gw = aws.ec2.NatGateway(
                f"migration-nat-gw-{i+1}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.tags,
                    'Name': f"migration-nat-gw-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self.migration_vpc, depends_on=[self.migration_igw], provider=self._provider)
            )
            self.migration_nat_gateways.append(nat_gw)

        # Route tables for production VPC
        self.production_public_rt = aws.ec2.RouteTable(
            f"production-public-rt-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            tags={
                **self.tags,
                'Name': f"production-public-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        aws.ec2.Route(
            f"production-public-route-{self.environment_suffix}",
            route_table_id=self.production_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.production_igw.id,
            opts=ResourceOptions(parent=self.production_public_rt, provider=self._provider)
        )

        for i, subnet in enumerate(self.production_public_subnets):
            aws.ec2.RouteTableAssociation(
                f"production-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.production_public_rt.id,
                opts=ResourceOptions(parent=subnet, provider=self._provider)
            )

        # Private route table for production VPC
        self.production_private_rt = aws.ec2.RouteTable(
            f"production-private-rt-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            tags={
                **self.tags,
                'Name': f"production-private-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        if self.production_nat_gateways:
            aws.ec2.Route(
                f"production-private-route-{self.environment_suffix}",
                route_table_id=self.production_private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.production_nat_gateways[0].id,
                opts=ResourceOptions(parent=self.production_private_rt, provider=self._provider)
            )

        for i, subnet in enumerate(self.production_private_subnets + self.production_dms_subnets):
            aws.ec2.RouteTableAssociation(
                f"production-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.production_private_rt.id,
                opts=ResourceOptions(parent=subnet, provider=self._provider)
            )

        # Route tables for migration VPC
        self.migration_public_rt = aws.ec2.RouteTable(
            f"migration-public-rt-{self.environment_suffix}",
            vpc_id=self.migration_vpc.id,
            tags={
                **self.tags,
                'Name': f"migration-public-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
        )

        aws.ec2.Route(
            f"migration-public-route-{self.environment_suffix}",
            route_table_id=self.migration_public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.migration_igw.id,
            opts=ResourceOptions(parent=self.migration_public_rt, provider=self._provider)
        )

        for i, subnet in enumerate(self.migration_public_subnets):
            aws.ec2.RouteTableAssociation(
                f"migration-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.migration_public_rt.id,
                opts=ResourceOptions(parent=subnet, provider=self._provider)
            )

        # Private route table for migration VPC
        self.migration_private_rt = aws.ec2.RouteTable(
            f"migration-private-rt-{self.environment_suffix}",
            vpc_id=self.migration_vpc.id,
            tags={
                **self.tags,
                'Name': f"migration-private-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.migration_vpc, provider=self._provider)
        )

        if self.migration_nat_gateways:
            aws.ec2.Route(
                f"migration-private-route-{self.environment_suffix}",
                route_table_id=self.migration_private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.migration_nat_gateways[0].id,
                opts=ResourceOptions(parent=self.migration_private_rt, provider=self._provider)
            )

        for i, subnet in enumerate(self.migration_private_subnets + self.migration_dms_subnets):
            aws.ec2.RouteTableAssociation(
                f"migration-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.migration_private_rt.id,
                opts=ResourceOptions(parent=subnet, provider=self._provider)
            )

        # Transit Gateway
        self.transit_gateway = aws.ec2transitgateway.TransitGateway(
            f"migration-tgw-{self.environment_suffix}",
            description=f"Transit Gateway for migration - {self.environment_suffix}",
            default_route_table_association="enable",
            default_route_table_propagation="enable",
            dns_support="enable",
            vpn_ecmp_support="enable",
            tags={
                **self.tags,
                'Name': f"migration-tgw-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self, provider=self._provider)
        )

        # Transit Gateway attachments for production VPC
        self.production_tgw_attachment = aws.ec2transitgateway.VpcAttachment(
            f"production-tgw-attachment-{self.environment_suffix}",
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.production_vpc.id,
            subnet_ids=[subnet.id for subnet in self.production_private_subnets],
            dns_support="enable",
            tags={
                **self.tags,
                'Name': f"production-tgw-attachment-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.transit_gateway, provider=self._provider)
        )

        # Transit Gateway attachment for migration VPC
        self.migration_tgw_attachment = aws.ec2transitgateway.VpcAttachment(
            f"migration-tgw-attachment-{self.environment_suffix}",
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.migration_vpc.id,
            subnet_ids=[subnet.id for subnet in self.migration_private_subnets],
            dns_support="enable",
            tags={
                **self.tags,
                'Name': f"migration-tgw-attachment-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.transit_gateway, provider=self._provider)
        )

        # Security groups
        self.db_security_group = aws.ec2.SecurityGroup(
            f"db-sg-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            description=f"Security group for RDS databases - {self.environment_suffix}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/8"],
                    description="PostgreSQL from internal networks"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **self.tags,
                'Name': f"db-sg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        self.lambda_security_group = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            description=f"Security group for Lambda functions - {self.environment_suffix}",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **self.tags,
                'Name': f"lambda-sg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        self.dms_security_group = aws.ec2.SecurityGroup(
            f"dms-sg-{self.environment_suffix}",
            vpc_id=self.production_vpc.id,
            description=f"Security group for DMS replication instances - {self.environment_suffix}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/8"],
                    description="PostgreSQL access"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **self.tags,
                'Name': f"dms-sg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.production_vpc, provider=self._provider)
        )

        # Register outputs
        self.register_outputs({
            'production_vpc_id': self.production_vpc.id,
            'migration_vpc_id': self.migration_vpc.id,
            'transit_gateway_id': self.transit_gateway.id,
            'production_private_subnet_ids': [s.id for s in self.production_private_subnets],
            'migration_private_subnet_ids': [s.id for s in self.migration_private_subnets],
            'db_security_group_id': self.db_security_group.id,
            'lambda_security_group_id': self.lambda_security_group.id,
            'dms_security_group_id': self.dms_security_group.id
        })
