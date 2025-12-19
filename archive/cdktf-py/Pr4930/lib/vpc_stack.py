"""VPC infrastructure stack."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation


class VpcStack(Construct):
    """VPC stack with public and private subnets across two AZs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str
    ):
        """Initialize VPC infrastructure."""
        super().__init__(scope, construct_id)

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"product-catalog-vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"product-catalog-igw-{environment_suffix}"
            }
        )

        # Create public subnets in two AZs
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"product-catalog-public-subnet-1-{environment_suffix}"
            }
        )

        self.public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"product-catalog-public-subnet-2-{environment_suffix}"
            }
        )

        # Create private subnets in two AZs
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={
                "Name": f"product-catalog-private-subnet-1-{environment_suffix}"
            }
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={
                "Name": f"product-catalog-private-subnet-2-{environment_suffix}"
            }
        )

        # Create Elastic IP for NAT Gateway
        nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={
                "Name": f"product-catalog-nat-eip-{environment_suffix}"
            }
        )

        # Create NAT Gateway in first public subnet
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={
                "Name": f"product-catalog-nat-{environment_suffix}"
            }
        )

        # Create public route table
        public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"product-catalog-public-rt-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_subnet_1_association",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_route_table.id
        )

        RouteTableAssociation(
            self,
            "public_subnet_2_association",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_route_table.id
        )

        # Create private route table
        private_route_table = RouteTable(
            self,
            "private_route_table",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
            ],
            tags={
                "Name": f"product-catalog-private-rt-{environment_suffix}"
            }
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_subnet_1_association",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_route_table.id
        )

        RouteTableAssociation(
            self,
            "private_subnet_2_association",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_route_table.id
        )

    @property
    def vpc_id(self):
        """Return VPC ID."""
        return self.vpc.id

    @property
    def public_subnet_ids(self):
        """Return list of public subnet IDs."""
        return [self.public_subnet_1.id, self.public_subnet_2.id]

    @property
    def private_subnet_ids(self):
        """Return list of private subnet IDs."""
        return [self.private_subnet_1.id, self.private_subnet_2.id]
