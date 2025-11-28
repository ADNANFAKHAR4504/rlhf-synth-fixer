"""
VPC Construct
Creates VPC with 3 AZs, private subnets, NAT gateways, and security groups
"""

from typing import List

from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class VpcConstruct(Construct):
    """
    VPC construct with multi-AZ setup for high availability.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        cidr_block: str,
        availability_zones: List[str],
    ):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}-{region}",
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}-{region}",
            }
        )

        # Public Subnets (for NAT Gateways)
        public_subnets = []
        for idx, az in enumerate(availability_zones):
            public_subnet = Subnet(
                self,
                f"public-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{cidr_block.rsplit('.', 2)[0]}.{idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{environment_suffix}-{region}-{az}",
                    "Type": "Public",
                }
            )
            public_subnets.append(public_subnet)

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public-rt",
            vpc_id=self.vpc.id,
            route=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": igw.id,
            }],
            tags={
                "Name": f"public-rt-{environment_suffix}-{region}",
            }
        )

        # Associate public subnets with public route table
        for idx, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public-rta-{idx}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # NAT Gateways (one per AZ for HA)
        nat_gateways = []
        for idx, public_subnet in enumerate(public_subnets):
            eip = Eip(
                self,
                f"nat-eip-{idx}",
                domain="vpc",
                tags={
                    "Name": f"nat-eip-{environment_suffix}-{region}-az{idx+1}",
                }
            )

            nat_gw = NatGateway(
                self,
                f"nat-gw-{idx}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"nat-gw-{environment_suffix}-{region}-az{idx+1}",
                }
            )
            nat_gateways.append(nat_gw)

        # Private Subnets (for Aurora, Lambda)
        self.private_subnets = []
        for idx, az in enumerate(availability_zones):
            private_subnet = Subnet(
                self,
                f"private-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{cidr_block.rsplit('.', 2)[0]}.{idx+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"private-subnet-{environment_suffix}-{region}-{az}",
                    "Type": "Private",
                }
            )
            self.private_subnets.append(private_subnet)

            # Private Route Table (routes to NAT Gateway)
            private_rt = RouteTable(
                self,
                f"private-rt-{idx}",
                vpc_id=self.vpc.id,
                route=[{
                    "cidr_block": "0.0.0.0/0",
                    "nat_gateway_id": nat_gateways[idx].id,
                }],
                tags={
                    "Name": f"private-rt-{environment_suffix}-{region}-az{idx+1}",
                }
            )

            RouteTableAssociation(
                self,
                f"private-rta-{idx}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
            )

        # Security Group for Aurora Database
        self.database_sg = SecurityGroup(
            self,
            "database-sg",
            name=f"database-sg-{environment_suffix}-{region}",
            description="Security group for Aurora database access",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"database-sg-{environment_suffix}-{region}",
            }
        )

        # Security Group for Lambda Functions
        self.lambda_sg = SecurityGroup(
            self,
            "lambda-sg",
            name=f"lambda-sg-{environment_suffix}-{region}",
            description="Security group for Lambda health check functions",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"lambda-sg-{environment_suffix}-{region}",
            }
        )

        # Lambda -> Aurora access (port 5432 for PostgreSQL)
        SecurityGroupRule(
            self,
            "lambda-to-aurora",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.lambda_sg.id,
            security_group_id=self.database_sg.id,
            description="Allow Lambda to access Aurora PostgreSQL",
        )

        # Lambda egress (HTTPS for Secrets Manager)
        SecurityGroupRule(
            self,
            "lambda-egress-https",
            type="egress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.lambda_sg.id,
            description="Allow Lambda HTTPS egress for Secrets Manager",
        )

        # Lambda egress (database port)
        SecurityGroupRule(
            self,
            "lambda-egress-db",
            type="egress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=[cidr_block],
            security_group_id=self.lambda_sg.id,
            description="Allow Lambda to connect to Aurora",
        )

    @property
    def vpc_id(self) -> str:
        return self.vpc.id

    @property
    def private_subnet_ids(self) -> List[str]:
        return [subnet.id for subnet in self.private_subnets]

    @property
    def database_security_group_id(self) -> str:
        return self.database_sg.id

    @property
    def lambda_security_group_id(self) -> str:
        return self.lambda_sg.id