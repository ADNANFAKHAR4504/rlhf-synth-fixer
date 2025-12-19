"""Network infrastructure stack - VPC, subnets, security groups"""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkStack(Construct):
    """Creates VPC with 3 AZs, public and private subnets"""

    def __init__(self, scope: Construct, construct_id: str, region: str, environment_suffix: str):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix

        # VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"dr-vpc-{region}-{environment_suffix}"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"dr-igw-{region}-{environment_suffix}"
            }
        )

        # Get availability zones (3 AZs)
        azs = [f"{region}a", f"{region}b", f"{region}c"]

        # Public subnets
        self.public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"dr-public-subnet-{i}-{region}-{environment_suffix}",
                    "Type": "public"
                }
            )
            self.public_subnets.append(subnet)

        # Private subnets
        self.private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"dr-private-subnet-{i}-{region}-{environment_suffix}",
                    "Type": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Public route table
        self.public_route_table = RouteTable(
            self,
            "public-route-table",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={
                "Name": f"dr-public-rt-{region}-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public-rt-assoc-{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # NAT Gateways (one per AZ for high availability)
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"nat-eip-{i}",
                domain="vpc",
                tags={
                    "Name": f"dr-nat-eip-{i}-{region}-{environment_suffix}"
                }
            )

            # NAT Gateway
            nat = NatGateway(
                self,
                f"nat-gateway-{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"dr-nat-{i}-{region}-{environment_suffix}"
                }
            )
            self.nat_gateways.append(nat)

        # Private route tables (one per AZ)
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = RouteTable(
                self,
                f"private-route-table-{i}",
                vpc_id=self.vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat.id
                )],
                tags={
                    "Name": f"dr-private-rt-{i}-{region}-{environment_suffix}"
                }
            )

            RouteTableAssociation(
                self,
                f"private-rt-assoc-{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Security Groups

        # Lambda security group
        self.lambda_security_group = SecurityGroup(
            self,
            "lambda-sg",
            name=f"dr-lambda-sg-{region}-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            ingress=[],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={
                "Name": f"dr-lambda-sg-{region}-{environment_suffix}"
            }
        )

        # Aurora security group
        self.aurora_security_group = SecurityGroup(
            self,
            "aurora-sg",
            name=f"dr-aurora-sg-{region}-{environment_suffix}",
            description="Security group for Aurora database",
            vpc_id=self.vpc.id,
            ingress=[SecurityGroupIngress(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                security_groups=[self.lambda_security_group.id],
                description="PostgreSQL from Lambda"
            )],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={
                "Name": f"dr-aurora-sg-{region}-{environment_suffix}"
            }
        )
