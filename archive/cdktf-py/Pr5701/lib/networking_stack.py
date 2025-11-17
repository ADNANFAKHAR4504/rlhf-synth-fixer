"""Networking Stack for Multi-Tier VPC Architecture."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration,
    S3BucketLifecycleConfigurationRuleFilter,
)
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf import TerraformOutput, Fn


class NetworkingStack(Construct):
    """Multi-tier VPC networking stack with public, private, and database subnets."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        """Initialize the Networking Stack.

        Args:
            scope: The parent construct
            construct_id: The construct ID
            environment_suffix: Environment suffix for resource naming
            aws_region: AWS region for deployment
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # Get availability zones dynamically
        self.azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available",
            filter=[{
                "name": "region-name",
                "values": [aws_region]
            }]
        )

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.igw = self._create_internet_gateway()

        # Create Subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        self.database_subnets = self._create_database_subnets()

        # Create NAT Gateways (one per AZ)
        self.nat_gateways = self._create_nat_gateways()

        # Create Route Tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
        self.database_route_tables = self._create_database_route_tables()

        # Create VPC Flow Logs
        self.flow_log_bucket = self._create_flow_log_bucket()
        self.flow_log = self._create_flow_log()

        # Export outputs
        self._create_outputs()

    def _create_vpc(self) -> Vpc:
        """Create the VPC with DNS support enabled."""
        return Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{self.environment_suffix}",
                "Environment": "Production",
                "Project": "PaymentGateway",
            },
        )

    def _create_internet_gateway(self) -> InternetGateway:
        """Create Internet Gateway for public subnet access."""
        return InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{self.environment_suffix}",
                "Environment": "Production",
                "Project": "PaymentGateway",
            },
        )

    def _create_public_subnets(self) -> list:
        """Create three public subnets across availability zones."""
        public_subnets = []
        cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

        for idx, cidr in enumerate(cidrs):
            az_name = Fn.element(self.azs.names, idx)
            subnet = Subnet(
                self,
                f"public_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                    "Tier": "Public",
                },
            )
            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> list:
        """Create three private application subnets."""
        private_subnets = []
        cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

        for idx, cidr in enumerate(cidrs):
            az_name = Fn.element(self.azs.names, idx)
            subnet = Subnet(
                self,
                f"private_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                    "Tier": "Private",
                },
            )
            private_subnets.append(subnet)

        return private_subnets

    def _create_database_subnets(self) -> list:
        """Create three database subnets with no internet access."""
        database_subnets = []
        cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

        for idx, cidr in enumerate(cidrs):
            az_name = Fn.element(self.azs.names, idx)
            subnet = Subnet(
                self,
                f"database_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-database-subnet-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                    "Tier": "Database",
                },
            )
            database_subnets.append(subnet)

        return database_subnets

    def _create_nat_gateways(self) -> list:
        """Create NAT Gateways (one per AZ) for private subnet internet access."""
        nat_gateways = []

        for idx, public_subnet in enumerate(self.public_subnets):
            # Allocate Elastic IP
            eip = Eip(
                self,
                f"nat_eip_{idx}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                },
            )

            # Create NAT Gateway
            nat_gateway = NatGateway(
                self,
                f"nat_gateway_{idx}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"payment-nat-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                },
                depends_on=[self.igw],
            )
            nat_gateways.append(nat_gateway)

        return nat_gateways

    def _create_public_route_table(self) -> RouteTable:
        """Create public route table with IGW route."""
        route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"payment-public-rt-{self.environment_suffix}",
                "Environment": "Production",
                "Project": "PaymentGateway",
            },
        )

        # Associate public subnets with public route table
        for idx, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rta_{idx}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
            )

        return route_table

    def _create_private_route_tables(self) -> list:
        """Create private route tables (one per AZ) with NAT Gateway routes."""
        route_tables = []

        for idx, (private_subnet, nat_gateway) in enumerate(
            zip(self.private_subnets, self.nat_gateways)
        ):
            route_table = RouteTable(
                self,
                f"private_route_table_{idx}",
                vpc_id=self.vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gateway.id,
                    )
                ],
                tags={
                    "Name": f"payment-private-rt-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                },
            )

            # Associate private subnet with route table
            RouteTableAssociation(
                self,
                f"private_rta_{idx}",
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
            )

            route_tables.append(route_table)

        return route_tables

    def _create_database_route_tables(self) -> list:
        """Create database route tables with no internet access (local only)."""
        route_tables = []

        for idx, database_subnet in enumerate(self.database_subnets):
            route_table = RouteTable(
                self,
                f"database_route_table_{idx}",
                vpc_id=self.vpc.id,
                # No routes - local VPC traffic only
                tags={
                    "Name": f"payment-database-rt-{idx+1}-{self.environment_suffix}",
                    "Environment": "Production",
                    "Project": "PaymentGateway",
                },
            )

            # Associate database subnet with route table
            RouteTableAssociation(
                self,
                f"database_rta_{idx}",
                subnet_id=database_subnet.id,
                route_table_id=route_table.id,
            )

            route_tables.append(route_table)

        return route_tables

    def _create_flow_log_bucket(self) -> S3Bucket:
        """Create S3 bucket for VPC Flow Logs with lifecycle policy."""
        bucket = S3Bucket(
            self,
            "flow_log_bucket",
            bucket_prefix=f"payment-vpc-flow-logs-{self.environment_suffix}-",
            force_destroy=True,
            tags={
                "Name": f"payment-vpc-flow-logs-{self.environment_suffix}",
                "Environment": "Production",
                "Project": "PaymentGateway",
            },
        )

        # Configure lifecycle policy to delete logs after 30 days
        S3BucketLifecycleConfiguration(
            self,
            "flow_log_bucket_lifecycle",
            bucket=bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="delete-old-logs",
                    status="Enabled",
                    filter=[S3BucketLifecycleConfigurationRuleFilter(
                        prefix=""
                    )],
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(
                        days=30
                    )],
                )
            ],
        )

        return bucket

    def _create_flow_log(self) -> FlowLog:
        """Create VPC Flow Log to capture all traffic."""
        return FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=f"arn:aws:s3:::{self.flow_log_bucket.bucket}",
            tags={
                "Name": f"payment-vpc-flow-log-{self.environment_suffix}",
                "Environment": "Production",
                "Project": "PaymentGateway",
            },
        )

    def _create_outputs(self):
        """Export stack outputs."""
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "vpc_cidr",
            value=self.vpc.cidr_block,
            description="VPC CIDR block",
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[subnet.id for subnet in self.public_subnets],
            description="Public subnet IDs",
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[subnet.id for subnet in self.private_subnets],
            description="Private subnet IDs",
        )

        TerraformOutput(
            self,
            "database_subnet_ids",
            value=[subnet.id for subnet in self.database_subnets],
            description="Database subnet IDs",
        )

        TerraformOutput(
            self,
            "nat_gateway_ids",
            value=[nat.id for nat in self.nat_gateways],
            description="NAT Gateway IDs",
        )

        TerraformOutput(
            self,
            "internet_gateway_id",
            value=self.igw.id,
            description="Internet Gateway ID",
        )

        TerraformOutput(
            self,
            "flow_log_bucket_name",
            value=self.flow_log_bucket.bucket,
            description="VPC Flow Log S3 bucket name",
        )
