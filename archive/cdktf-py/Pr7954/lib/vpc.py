from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation


class VpcConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"financial-vpc-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(self, "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"financial-igw-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets
        self.public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"financial-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "Type": "public"
                }
            )
            self.public_subnets.append(subnet)

        # Private Subnets
        self.private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(self, f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"financial-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering",
                    "Type": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Public Route Table
        self.public_route_table = RouteTable(self, "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={
                "Name": f"financial-public-rt-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # NAT Gateways (one per AZ for high availability)
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = Eip(self, f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"financial-nat-eip-{i+1}-{environment_suffix}",
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )

            nat = NatGateway(self, f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"financial-nat-{i+1}-{environment_suffix}",
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )
            self.nat_gateways.append(nat)

        # Private Route Tables (one per AZ)
        self.private_route_tables = []
        for i, nat in enumerate(self.nat_gateways):
            rt = RouteTable(self, f"private_rt_{i}",
                vpc_id=self.vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat.id
                )],
                tags={
                    "Name": f"financial-private-rt-{i+1}-{environment_suffix}",
                    "Environment": f"{environment_suffix}",
                    "Application": "financial-transaction-platform",
                    "CostCenter": "engineering"
                }
            )
            self.private_route_tables.append(rt)

            # Associate private subnet with its route table
            RouteTableAssociation(self, f"private_rt_assoc_{i}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=rt.id
            )
