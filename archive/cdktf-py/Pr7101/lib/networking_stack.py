"""Networking infrastructure for multi-region disaster recovery."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkingStack(Construct):
    """Networking infrastructure for a single region."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, region: str, provider):
        super().__init__(scope, construct_id)

        # VPC
        self.vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16" if "east" in region else "10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"payment-igw-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Availability Zones (3 AZs)
        azs = [f"{region}a", f"{region}b", f"{region}c"]
        base_cidr = "10.0" if "east" in region else "10.1"

        # Public subnets
        public_subnets = []
        for idx, az in enumerate(azs):
            subnet = Subnet(
                self, f"public_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{idx}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"payment-public-{az}-{environment_suffix}"},
                provider=provider,
            )
            public_subnets.append(subnet)

        # Private subnets
        self.private_subnets = []
        for idx, az in enumerate(azs):
            subnet = Subnet(
                self, f"private_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_cidr}.{idx + 10}.0/24",
                availability_zone=az,
                tags={"Name": f"payment-private-{az}-{environment_suffix}"},
                provider=provider,
            )
            self.private_subnets.append(subnet)

        # NAT Gateway
        eip = Eip(
            self, "nat_eip",
            domain="vpc",
            tags={"Name": f"payment-nat-eip-{region}-{environment_suffix}"},
            provider=provider,
        )

        nat_gateway = NatGateway(
            self, "nat_gateway",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={"Name": f"payment-nat-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Public route table
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags={"Name": f"payment-public-rt-{region}-{environment_suffix}"},
            provider=provider,
        )

        for idx, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public_rt_assoc_{idx}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                provider=provider,
            )

        # Private route table
        private_rt = RouteTable(
            self, "private_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", nat_gateway_id=nat_gateway.id)],
            tags={"Name": f"payment-private-rt-{region}-{environment_suffix}"},
            provider=provider,
        )

        for idx, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self, f"private_rt_assoc_{idx}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                provider=provider,
            )

        # Security group for Aurora
        self.db_security_group = SecurityGroup(
            self, "db_sg",
            name=f"payment-db-sg-{region}-{environment_suffix}",
            description="Security group for Aurora database",
            vpc_id=self.vpc.id,
            ingress=[SecurityGroupIngress(
                from_port=3306, to_port=3306, protocol="tcp",
                cidr_blocks=[self.vpc.cidr_block],
                description="MySQL from VPC",
            )],
            egress=[SecurityGroupEgress(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={"Name": f"payment-db-sg-{region}-{environment_suffix}"},
            provider=provider,
        )

        # Security group for Lambda
        self.lambda_security_group = SecurityGroup(
            self, "lambda_sg",
            name=f"payment-lambda-sg-{region}-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0, to_port=0, protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
            tags={"Name": f"payment-lambda-sg-{region}-{environment_suffix}"},
            provider=provider,
        )
